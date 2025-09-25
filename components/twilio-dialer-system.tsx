"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Phone, PhoneOff, Mic, MicOff, Settings, Play, Pause,
  ChevronLeft, ChevronRight, TestTube, CheckCircle, XCircle, Loader2,
} from "lucide-react"
import { Device, Call } from "@twilio/voice-sdk"

interface TelemarketingLead {
  id: number
  company_name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  status: string
  priority: string
  notes: string | null
}

interface TwilioDialerSystemProps {
  leads?: TelemarketingLead[]
  onCallComplete?: (leadId: number, status: string, notes: string) => void
  onLeadUpdate?: (leadId: number, updates: Partial<TelemarketingLead>) => void
}

export function TwilioDialerSystem({ leads = [] }: TwilioDialerSystemProps) {
  // Device + call state
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null)
  const [deviceStatus, setDeviceStatus] =
    useState<"disconnected" | "connecting" | "connected" | "error">("disconnected")
  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [callStatus, setCallStatus] =
    useState<"idle" | "connecting" | "ringing" | "connected" | "ended">("idle")
  const [callDuration, setCallDuration] = useState(0)

  // Audio + UI
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(50)
  const [microphoneLevel, setMicrophoneLevel] = useState(0)
  const [isAudioTestOpen, setIsAudioTestOpen] = useState(false)
  const [microphoneStatus, setMicrophoneStatus] =
    useState<"untested" | "testing" | "passed" | "failed">("untested")
  const [speakerStatus, setSpeakerStatus] =
    useState<"untested" | "testing" | "passed" | "failed">("untested")
  const audioRef = useRef<HTMLAudioElement>(null) // plays remote party audio
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Dialer state
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedLead, setSelectedLead] = useState<TelemarketingLead | null>(null)
  const [callNotes, setCallNotes] = useState("")
  const [callRating, setCallRating] = useState(0)

  // Power dialer
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [isAutoDialing, setIsAutoDialing] = useState(false)
  const [dialingSpeed, setDialingSpeed] = useState(5)
  const [isPowerDialerActive, setIsPowerDialerActive] = useState(false)

  // Mode
  const [connectionMode, setConnectionMode] =
    useState<"direct" | "conference" | "power">("conference")

  // Timers
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Utility to format phone number to E.164 (+1XXXXXXXXXX)
  const formatPhoneNumber = (number: string): string => {
    const digits = number.replace(/\D/g, "")
    // Minimal E.164 check: if it starts with + or has 10/11 digits
    if (number.startsWith("+") && digits.length > 5) return `+${digits}`
    if (digits.length === 10) return `+1${digits}`
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
    return ""
  }
  
  // ---------- fetch guards (stop JSON.parse explosions) ----------
  const safeFetch = useCallback(async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init)
    const ctype = res.headers.get("content-type") || ""
    const body = await res.text() // read once
    const toJSON = () => {
      try { return body ? JSON.parse(body) : null } // Return null on JSON parse error
      catch { return null }
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      contentType: ctype,
      raw: body,
      json: toJSON(),
    }
  }, [])

  // strict JSON (token must be JSON)
  const getJsonOrThrow = (result: Awaited<ReturnType<typeof safeFetch>>, label: string) => {
    if (!result.ok) {
      throw new Error(`[${label}] ${result.status} ${result.statusText}. Body: ${result.raw.slice(0, 400)}`)
    }
    if (!/application\/json/i.test(result.contentType) || result.json == null) {
      throw new Error(`[${label}] Expected JSON, got ${result.contentType || "unknown"}. Body: ${result.raw.slice(0, 400)}`)
    }
    return result.json
  }

  // ---------- audio helpers ----------
  const cleanupRemoteAudio = () => {
    if (!audioRef.current) return
    try {
      audioRef.current.pause()
      const src = audioRef.current.srcObject as MediaStream | null
      src?.getTracks().forEach(t => t.stop())
    } catch {}
    audioRef.current.srcObject = null
  }

  const wireCallAudio = (call: Call) => {
    // Twilio emits an <audio> for the far end; route it into our hidden tag for volume control.
    // @ts-ignore - Voice SDK v2 'audio' event
    call.on("audio", (remoteEl: HTMLAudioElement) => {
      if (!audioRef.current) return
      audioRef.current.srcObject = remoteEl.srcObject ?? null
      audioRef.current.autoplay = true
      audioRef.current.muted = false
      ;(audioRef.current as any).playsInline = true
      audioRef.current.volume = volume / 100
      audioRef.current.play().catch(() => {})
    })

    call.on(Call.EventName.Accept, () => {
      setCallStatus("connected")
      startCallTimer()
      // Fallback in case 'audio' fired before ref existed
      // @ts-ignore
      const stream = call.getRemoteStream?.()
      if (stream && audioRef.current) {
        audioRef.current.srcObject = stream
        audioRef.current.play().catch(() => {})
      }
    })

    call.on(Call.EventName.Disconnect, () => {
      cleanupRemoteAudio()
      setCurrentCall(null)
      setCallStatus("ended")
      stopCallTimer()
      // If power dialing, automatically advance after disconnect
      if (isPowerDialerActive) {
        // Add a small delay for status update/cleanup to complete
        setTimeout(nextLead, 1000) 
      }
    })

    call.on(Call.EventName.Mute, (muted: boolean) => setIsMuted(muted))
    call.on(Call.EventName.Ringing, () => setCallStatus("ringing"))
    call.on(Call.EventName.Error, (err: any) => {
      setErrMsg(`Call error: ${err?.message || String(err)}`)
      cleanupRemoteAudio()
      setCallStatus("ended")
      stopCallTimer()
    })
  }

  // ---------- timers ----------
  const startCallTimer = () => {
    setCallDuration(0)
    callTimerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000)
  }
  const stopCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current)
    callTimerRef.current = null
  }

  // ---------- device init ----------
  const initializeTwilioDevice = useCallback(async () => {
    setErrMsg(null)
    setDeviceStatus("connecting")

    // TOKEN: must be JSON
    const tokenRes = await safeFetch("/api/telemarketing/twilio/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ identity: "dialer-user" }),
    })
    let token: string
    try {
      const json = getJsonOrThrow(tokenRes, "token")
      token = json.token
    } catch (e: any) {
      setDeviceStatus("error")
      setErrMsg(e.message || String(e))
      return
    }

    try {
      // FIX: Ensure previous device is destroyed before creating a new one
      if (twilioDevice) twilioDevice.destroy() 
      
      const device = new Device(token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
      })

      // Route audio to default speakers; Twilio mic meter
      device.audio?.speakerDevices.set(["default"])
      // @ts-ignore
      device.audio?.on("inputVolume", (v: number) => setMicrophoneLevel(Math.round(v * 100)))

      device.on(Device.EventName.Registered, () => setDeviceStatus("connected"))
      device.on(Device.EventName.Error, (e: any) => { setDeviceStatus("error"); setErrMsg(`Device error: ${e?.message || String(e)}`) })
      device.on(Device.EventName.Incoming, (call: Call) => { 
        // Auto-accept conference calls
        if (call.parameters.CallSid) call.accept()
        setCurrentCall(call); setCallStatus("ringing"); wireCallAudio(call) 
      })
      device.on(Device.EventName.TokenWillExpire, async () => {
        const r = await safeFetch("/api/telemarketing/twilio/token", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ identity: "dialer-user" }),
        })
        try {
          const j = getJsonOrThrow(r, "token-refresh")
          device.updateToken(j.token)
        } catch (e: any) {
          setErrMsg(e.message || String(e))
        }
      })

      await device.register()
      setTwilioDevice(device)
    } catch (e: any) {
      setDeviceStatus("error")
      setErrMsg(e?.message || String(e))
    }
  }, [safeFetch, twilioDevice]) // Added twilioDevice to dependency array for cleanup

  // ---------- make call (FIXED) ----------
  const makeCall = async (number: string, leadId?: number) => {
    if (!twilioDevice || deviceStatus !== "connected") {
      setErrMsg("Twilio Device not ready")
      return
    }
    const formattedNumber = formatPhoneNumber(number)
    if (!formattedNumber) {
      setErrMsg("Invalid phone number format. Requires E.164 (+1XXXXXXXXXX).")
      return
    }

    try {
      setErrMsg(null)
      setCallStatus("connecting")

      let twilioParams: Record<string, string> = {}
      let serverPayload: Record<string, any> = {
        phoneNumber: formattedNumber,
        leadId,
        mode: connectionMode,
      }
      let conferenceName: string | undefined

      if (connectionMode === "direct") {
        // Direct Client-to-PSTN call (simple, but TwiML must handle it)
        twilioParams.To = formattedNumber
      } else if (connectionMode === "conference" || connectionMode === "power") {
        // Conference-based call (Browser joins conference, then PSTN leg joins same conference)
        
        // Use a unique name for conference mode, and a persistent one for power dialer
        conferenceName = connectionMode === "conference" 
            ? `dialer-${Date.now()}` 
            : "power-dialer-conference"
        
        // FIX: Twilio Device connects to the TwiML app with custom parameters
        // The TwiML app (backend) must read 'conferenceName' and put the client into that conference.
        twilioParams.conferenceName = conferenceName
        
        // The server needs the conference name to dial the PSTN leg into it
        serverPayload.conferenceName = conferenceName 
      } 
      
      // 1. Initiate browser connection
      const call = twilioDevice.connect({ params: twilioParams })
      setCurrentCall(call)
      wireCallAudio(call)

      // 2. Initiate PSTN leg for conference/power mode
      if (connectionMode !== "direct") {
        setCallStatus("ringing") // Assume ringing until accept/disconnect
        
        const res = await safeFetch("/api/telemarketing/twilio/call", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(serverPayload),
        })

        if (!res.ok) {
          // If the server-side call failed, we must disconnect the browser leg
          call.disconnect()
          throw new Error(`[call] Server failed to initiate PSTN leg: ${res.status} ${res.statusText}. Body: ${res.raw.slice(0, 400)}`)
        }
        
        // Optional: log callSid if provided
        if (res.json?.callSid) console.log("[v1] PSTN leg initiated:", res.json.callSid)
      }
      // If direct mode, the call object handles everything

    } catch (e: any) {
      console.error("[v1] Call failed:", e?.message || String(e))
      setErrMsg(e?.message || String(e))
      setCallStatus("idle")
      cleanupRemoteAudio()
      setCurrentCall(null)
    }
  }

  const hangupCall = () => {
    currentCall?.disconnect()
    setCurrentCall(null)
    setCallStatus("ended") // 'ended' is set on the disconnect event, but this forces an immediate UI refresh
    stopCallTimer()
    cleanupRemoteAudio()
  }

  const toggleMute = () => {
    if (!currentCall) return
    const newMuted = !isMuted
    currentCall.mute(newMuted)
    setIsMuted(newMuted)
  }

  // ---------- power dial ----------
  const startPowerDialer = () => {
    if (leads.length === 0) return setErrMsg("No leads to dial.")
    setConnectionMode("power")
    setIsPowerDialerActive(true)
    setIsAutoDialing(true)
    // FIX: Set initial lead when starting
    setSelectedLead(leads[currentLeadIndex]) 
  }
  const stopPowerDialer = () => { setIsPowerDialerActive(false); setIsAutoDialing(false) }
  const nextLead = () => {
    if (currentLeadIndex < leads.length - 1) {
      setCurrentLeadIndex(currentLeadIndex + 1)
      setSelectedLead(leads[currentLeadIndex + 1])
    } else {
      stopPowerDialer()
    }
  }
  const previousLead = () => {
    if (currentLeadIndex > 0) {
      setCurrentLeadIndex(currentLeadIndex - 1)
      setSelectedLead(leads[currentLeadIndex - 1])
    }
  }

  // ---------- effects ----------
  useEffect(() => { 
    initializeTwilioDevice(); 
    return () => { try { twilioDevice?.destroy() } catch {} } 
  }, [initializeTwilioDevice])
  
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100 }, [volume])
  
  // Auto-dial logic
  useEffect(() => {
    // Only auto-dial if power dialer is active, lead exists, and no current call is active/connecting/ringing
    if (!isAutoDialing || !selectedLead?.phone || callStatus !== "idle") return
    
    setErrMsg(`Auto-dialing ${selectedLead.contact_person} in ${dialingSpeed} seconds...`)
    
    const t = setTimeout(() => {
        setErrMsg(null)
        makeCall(selectedLead.phone!, selectedLead.id)
    }, dialingSpeed * 1000)
    
    return () => clearTimeout(t)
  }, [isAutoDialing, selectedLead, callStatus, dialingSpeed, makeCall])
  
  // Set initial manual dial number when switching to manual
  useEffect(() => {
    if (connectionMode === "conference" || connectionMode === "direct") {
        setPhoneNumber(selectedLead?.phone || "")
    }
  }, [connectionMode, selectedLead])


  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Twilio Dialer System
            <div className="flex items-center gap-2">
              <Badge variant={
                deviceStatus === "connected" ? "default" :
                deviceStatus === "connecting" ? "secondary" :
                deviceStatus === "error" ? "destructive" : "outline"
              }>
                {deviceStatus === "connecting" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {deviceStatus === "connected" && <CheckCircle className="h-3 w-3 mr-1" />}
                {deviceStatus === "error" && <XCircle className="h-3 w-3 mr-1" />}
                {deviceStatus}
              </Badge>
              {errMsg && <Badge variant="destructive" title={errMsg}>Error</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Mic className={`h-4 w-4 ${microphoneLevel > 10 ? "text-green-500" : "text-gray-400"}`} />
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-100" style={{ width: `${microphoneLevel}%` }} />
                </div>
              </div>
              <Badge variant="outline">Call Status: {callStatus}</Badge>
              {callStatus === "connected" && <Badge variant="outline">Duration: {formatDuration(callDuration)}</Badge>}
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isAudioTestOpen} onOpenChange={setIsAudioTestOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><TestTube className="h-4 w-4 mr-1" /> Audio Test</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Audio System Test</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    {/* Microphone Test Logic remains the same (as it's browser-side) */}
                    <div className="flex items-center justify-between">
                      <Label>Microphone Test</Label>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={async () => {
                          setMicrophoneStatus("testing")
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                            setTimeout(() => { stream.getTracks().forEach(t => t.stop()); setMicrophoneStatus("passed") }, 3000)
                          } catch { setMicrophoneStatus("failed") }
                        }} disabled={microphoneStatus === "testing"}>
                          {microphoneStatus === "testing" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Test Mic
                        </Button>
                        <Badge variant={
                          microphoneStatus === "passed" ? "default" :
                          microphoneStatus === "failed" ? "destructive" : "outline"
                        }>{microphoneStatus}</Badge>
                      </div>
                    </div>
                    {/* Speaker Test Logic remains the same (as it's browser-side) */}
                    <div className="flex items-center justify-between">
                      <Label>Speaker Test</Label>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSpeakerStatus("testing")
                          const ctx = new AudioContext()
                          const osc = ctx.createOscillator()
                          const gain = ctx.createGain()
                          osc.connect(gain); gain.connect(ctx.destination)
                          osc.frequency.value = 440; gain.gain.value = 0.1
                          osc.start(); setTimeout(() => { osc.stop(); ctx.close(); setSpeakerStatus("passed") }, 2000)
                        }} disabled={speakerStatus === "testing"}>
                          {speakerStatus === "testing" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Test Speakers
                        </Button>
                        <Badge variant={
                          speakerStatus === "passed" ? "default" :
                          speakerStatus === "failed" ? "destructive" : "outline"
                        }>{speakerStatus}</Badge>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={initializeTwilioDevice} disabled={deviceStatus === "connecting"}>
                {deviceStatus === "connecting" ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Settings className="h-4 w-4 mr-1" />} Reconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w/full grid-cols-3">
          <TabsTrigger value="manual">Manual Dialer</TabsTrigger>
          <TabsTrigger value="power">Power Dialer</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Manual Dialer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input placeholder="Enter phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="flex-1" disabled={callStatus !== "idle"} />
                <Button onClick={() => makeCall(phoneNumber)} disabled={!phoneNumber || callStatus !== "idle" || deviceStatus !== "connected"} className="bg-green-600 hover:bg-green-700">
                  <Phone className="h-4 w-4 mr-1" /> Call
                </Button>
              </div>

              {callStatus !== "idle" && (
                <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Button variant="outline" onClick={toggleMute} disabled={callStatus !== "connected"}>
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <div className="text-center">
                    <div className="font-semibold">{phoneNumber}</div>
                    <div className="text-sm text-gray-600">{callStatus}</div>
                    {callStatus === "connected" && <div className="text-sm text-gray-600">{formatDuration(callDuration)}</div>}
                  </div>
                  <Button variant="destructive" onClick={hangupCall}><PhoneOff className="h-4 w-4" /></Button>
                </div>
              )}

              {/* ... Lead and Notes UI (retained for context) ... */}
              {selectedLead && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold">{selectedLead.company_name}</h3>
                    <p className="text-sm text-gray-600">{selectedLead.contact_person}</p>
                    <p className="text-sm text-gray-600">{selectedLead.phone}</p>
                  </div>
                  <Textarea placeholder="Call notes..." value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3} />
                  <div className="flex items-center space-x-2">
                    <Label>Rating:</Label>
                    {[1,2,3,4,5].map(r => (
                      <Button key={r} variant={callRating >= r ? "default" : "outline"} size="sm" onClick={() => setCallRating(r)}>{r}</Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* ... Power Dialer and Settings Tabs (retained for context) ... */}
        <TabsContent value="power" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Power Dialer <Badge variant="outline">{currentLeadIndex + 1} of {leads.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No leads available for power dialing</div>
              ) : (
                <>
                  {selectedLead && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{selectedLead.company_name}</h3>
                        <Badge variant="outline">{selectedLead.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-1">{selectedLead.contact_person}</p>
                      <p className="text-gray-600">{selectedLead.phone}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={previousLead} disabled={currentLeadIndex === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>

                    <div className="flex items-center space-x-2">
                      <Button variant={isPowerDialerActive ? "destructive" : "default"} onClick={isPowerDialerActive ? stopPowerDialer : startPowerDialer} disabled={deviceStatus !== "connected" || callStatus !== "idle"}>
                        {isPowerDialerActive ? (<><Pause className="h-4 w-4 mr-1" /> Stop Auto</>) : (<><Play className="h-4 w-4 mr-1" /> Start Auto</>)}
                      </Button>
                      <Button variant="outline" size="sm"
                        onClick={() => selectedLead?.phone && makeCall(selectedLead.phone, selectedLead.id)}
                        disabled={!selectedLead?.phone || callStatus !== "idle" || deviceStatus !== "connected"}>
                        <Phone className="h-4 w-4 mr-1" /> Call Now
                      </Button>
                    </div>

                    <Button variant="outline" size="sm" onClick={nextLead} disabled={currentLeadIndex === leads.length - 1}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {isPowerDialerActive && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Auto-dial Speed</Label>
                        <span className="text-sm text-gray-600">{dialingSpeed}s between calls</span>
                      </div>
                      <Input type="range" min="3" max="30" value={dialingSpeed} onChange={(e) => setDialingSpeed(Number(e.target.value))} className="w-full" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span><span>{Math.round(((currentLeadIndex + 1) / leads.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                           style={{ width: `${((currentLeadIndex + 1) / leads.length) * 100}%` }} />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Dialer Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Connection Mode</Label>
                <Select value={connectionMode} onValueChange={(v: any) => setConnectionMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Connection</SelectItem>
                    <SelectItem value="conference">Conference Mode (Manual)</SelectItem>
                    <SelectItem value="power">Power Dialer Mode (Auto)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  {connectionMode === "direct" && "Direct phone-to-phone connection"}
                  {connectionMode === "conference" && "Browser joins conference room for 2-way audio"}
                  {connectionMode === "power" && "Persistent conference for rapid dialing"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Volume: {volume}%</Label>
                <Input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto-start audio monitoring</Label>
                <Switch checked={false} onCheckedChange={() => { /* optional: add custom mic monitor */ }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden element that actually plays the far-end audio */}
      <audio ref={audioRef} style={{ display: "none" }} />
    </div>
  )
}