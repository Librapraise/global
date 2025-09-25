"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, PhoneOff, ArrowLeft, Mic, Loader2 } from "lucide-react"
import { Device } from "@twilio/voice-sdk"

interface ManualDialerProps {
  user?: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualDialer({ user, isOpen, onOpenChange }: ManualDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [dialerStatus, setDialerStatus] = useState<"Ready" | "Calling" | "Connected" | "Error">("Ready")
  const [isCallActive, setIsCallActive] = useState(false)
  const [callStatus, setCallStatus] = useState("")
  const [isTestingMicPlayback, setIsTestingMicPlayback] = useState(false)
  const [isTestingSpeakers, setIsTestingSpeakers] = useState(false)
  const [microphoneLevel, setMicrophoneLevel] = useState(0)
  const [currentCallSid, setCurrentCallSid] = useState<string>("")
  const [isInitiatingCall, setIsInitiatingCall] = useState(false)
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null)
  const [isDeviceReady, setIsDeviceReady] = useState(false)
  const [currentCall, setCurrentCall] = useState<any>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isOpen && !twilioDevice) {
      initializeTwilioDevice()
    }

    return () => {
      if (twilioDevice) {
        twilioDevice.destroy()
        setTwilioDevice(null)
        setIsDeviceReady(false)
      }
    }
  }, [isOpen])

  const initializeTwilioDevice = async () => {
    try {
      console.log("[v0] Starting Twilio Device initialization...")

      // Get access token
      console.log("[v0] Fetching access token...")
      const tokenResponse = await fetch("/api/telemarketing/twilio/token")
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error("[v0] Token API error:", errorText)
        throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`)
      }

      let tokenData
      try {
        tokenData = await tokenResponse.json()
      } catch (jsonError) {
        const responseText = await tokenResponse.text()
        console.error("[v0] Failed to parse JSON response:", responseText)
        throw new Error(`Invalid JSON response from token API: ${jsonError.message}`)
      }

      const { token } = tokenData
      console.log("[v0] Access token received")

      // Request microphone permissions
      console.log("[v0] Requesting microphone permissions...")
      await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("[v0] Microphone permissions granted")

      console.log("[v0] Initializing Twilio Device...")
      const device = new Device(token, {
        logLevel: 1,
        answerOnBridge: true,
      })

      device.on("ready", () => {
        console.log("[v0] Twilio Device ready")
        setIsDeviceReady(true)
        setCallStatus("Browser audio ready - microphone and speakers connected")
      })

      device.on("error", (error: any) => {
        console.error("[v0] Twilio Device error:", error)
        const errorMessage = error?.message || error?.toString() || "Unknown device error"
        setCallStatus(`Device error: ${errorMessage}`)
        setDialerStatus("Error")
      })

      device.on("connect", (call: any) => {
        console.log("[v0] Call connected")
        setCurrentCall(call)
        setIsCallActive(true)
        setDialerStatus("Connected")
        setCallStatus("Connected - two-way audio active")
        setIsInitiatingCall(false)
      })

      device.on("disconnect", (call: any) => {
        console.log("[v0] Call disconnected")
        setCurrentCall(null)
        setIsCallActive(false)
        setDialerStatus("Ready")
        setCallStatus("Call ended")
        setCurrentCallSid("")
        setIsInitiatingCall(false)
      })

      device.on("incoming", (call: any) => {
        console.log("[v0] Incoming call")
        // Auto-accept incoming calls (for conference joining)
        call.accept()
      })

      setTwilioDevice(device)
      console.log("[v0] Twilio Device initialization completed")
    } catch (error) {
      console.error("[v0] Failed to initialize Twilio Device:", error)
      let errorMessage = "Unknown error"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      } else if (error && typeof error === "object") {
        errorMessage = error.toString()
      }
      setCallStatus(`Failed to initialize browser audio: ${errorMessage}`)
      setDialerStatus("Error")
    }
  }

  const formatPhoneNumber = (number: string): string => {
    // Remove all non-digit characters
    const digits = number.replace(/\D/g, "")

    // If it starts with 1 and has 11 digits, it's already in the right format
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`
    }

    // If it has 10 digits, add the US country code
    if (digits.length === 10) {
      return `+1${digits}`
    }

    // If it already starts with +, return as-is
    if (number.startsWith("+")) {
      return number.replace(/\D/g, "").replace(/^/, "+")
    }

    // Default: assume US number and add +1
    return `+1${digits}`
  }

  const validatePhoneNumber = (number: string): boolean => {
    const formatted = formatPhoneNumber(number)
    // Check if it's a valid US/Canada number (+1 followed by 10 digits)
    return /^\+1\d{10}$/.test(formatted)
  }

  const handleDialerCall = async () => {
    if (isInitiatingCall || !phoneNumber.trim() || !isDeviceReady) {
      if (!phoneNumber.trim()) {
        setCallStatus("Please enter a phone number")
      } else if (!isDeviceReady) {
        setCallStatus("Browser audio not ready - please wait")
      }
      return
    }

    try {
      setIsInitiatingCall(true)
      setDialerStatus("Calling")
      setCallStatus("Initiating conference call...")
      console.log(`[v0] Initiating conference call to: ${phoneNumber}`)

      const conferenceId = `conf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // First, connect browser to conference
      const params = {
        phoneNumber: phoneNumber.trim(),
        conferenceId: conferenceId,
        action: "join-conference",
      }

      console.log("[v0] Browser joining conference:", conferenceId)
      twilioDevice.connect(params)

      // Wait a moment for browser to join, then initiate outbound call
      setTimeout(async () => {
        try {
          const response = await fetch("/api/telemarketing/twilio/call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phoneNumber: phoneNumber.trim(),
              leadId: null,
              connectionMode: "conference",
              conferenceId: conferenceId,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
          }

          const callData = await response.json()
          console.log("[v0] Outbound call initiated:", callData.message)
          setCurrentCallSid(callData.callSid)
        } catch (error) {
          console.error("[v0] Outbound call failed:", error)
          // Disconnect browser call if outbound failed
          if (currentCall) {
            currentCall.disconnect()
          }
          throw error
        }
      }, 2000)
    } catch (error) {
      console.error("[v0] Call failed:", error)
      setDialerStatus("Error")
      setCallStatus(`Call failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsInitiatingCall(false)
    }
  }

  const handleHangup = () => {
    if (currentCall) {
      currentCall.disconnect()
    }
    setIsCallActive(false)
    setDialerStatus("Ready")
    setCallStatus("Call ended")
    setCurrentCallSid("")
    setIsInitiatingCall(false)
    setCurrentCall(null)
  }

  const handleMicrophonePlaybackTest = async () => {
    setIsTestingMicPlayback(true)
    setCallStatus("Testing microphone playback - speak into your microphone...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      micStreamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0.5

      microphone.connect(analyser)
      microphone.connect(gainNode)
      gainNode.connect(audioContext.destination)

      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        setMicrophoneLevel(Math.min(100, (average / 128) * 100))
      }

      const interval = setInterval(checkLevel, 100)

      setTimeout(() => {
        clearInterval(interval)
        stream.getTracks().forEach((track) => track.stop())
        audioContext.close()
        setIsTestingMicPlayback(false)
        setMicrophoneLevel(0)
        setCallStatus("Microphone playback test completed")
        micStreamRef.current = null
        audioContextRef.current = null
      }, 5000)
    } catch (error) {
      console.error("[v0] Microphone playback test failed:", error)
      setIsTestingMicPlayback(false)
      setCallStatus("Microphone playback test failed - check permissions")
    }
  }

  const handleSpeakerTest = async () => {
    setIsTestingSpeakers(true)
    setCallStatus("Testing speakers - you should hear a test tone...")

    try {
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1.9)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 2)

      oscillator.onended = () => {
        audioContext.close()
        setIsTestingSpeakers(false)
        setCallStatus("Speaker test completed - did you hear the tone?")
        audioContextRef.current = null
      }
    } catch (error) {
      console.error("[v0] Speaker test failed:", error)
      setIsTestingSpeakers(false)
      setCallStatus("Speaker test failed - check audio output")
    }
  }

  const cleanupAudioTests = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsTestingMicPlayback(false)
    setIsTestingSpeakers(false)
    setMicrophoneLevel(0)
  }

  useEffect(() => {
    if (isOpen) {
      setDialerStatus("Ready")
      setCallStatus("Initializing browser audio...")
    }

    return () => {
      if (!isOpen) {
        cleanupAudioTests()
        if (currentCall) {
          currentCall.disconnect()
        }
        setDialerStatus("Ready")
        setCallStatus("")
        setIsCallActive(false)
        setCurrentCallSid("")
        setIsInitiatingCall(false)
        setCurrentCall(null)
      }
    }
  }, [isOpen])

  const handleKeypadPress = (digit: string) => {
    setPhoneNumber((prev) => prev + digit)
  }

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Manual Dialer
            <Badge variant="outline" className="ml-2">
              {dialerStatus}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Connection Mode</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="default" size="sm" disabled>
                Conference
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Conference-based calling with browser audio</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-center text-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["1", ""],
              ["2", "ABC"],
              ["3", "DEF"],
              ["4", "GHI"],
              ["5", "JKL"],
              ["6", "MNO"],
              ["7", "PQRS"],
              ["8", "TUV"],
              ["9", "WXYZ"],
              ["*", ""],
              ["0", "+"],
              ["#", ""],
            ].map(([digit, letters]) => (
              <Button
                key={digit}
                variant="outline"
                className="h-12 flex flex-col items-center justify-center bg-transparent"
                onClick={() => handleKeypadPress(digit)}
              >
                <span className="text-lg font-bold">{digit}</span>
                {letters && <span className="text-xs text-gray-500">{letters}</span>}
              </Button>
            ))}
          </div>

          <div className="flex justify-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleBackspace} disabled={!phoneNumber}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {!isCallActive ? (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-6"
                onClick={handleDialerCall}
                disabled={!phoneNumber || !isDeviceReady || dialerStatus === "Calling" || isInitiatingCall}
              >
                <Phone className="h-4 w-4 mr-2" />
                {isInitiatingCall ? "Calling..." : "Call"}
              </Button>
            ) : (
              <Button className="bg-red-600 hover:bg-red-700 text-white px-6" onClick={handleHangup}>
                <PhoneOff className="h-4 w-4 mr-2" />
                Hang Up
              </Button>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Audio Setup</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMicrophonePlaybackTest}
                  disabled={isTestingMicPlayback || isTestingSpeakers}
                >
                  {isTestingMicPlayback ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Mic...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Mic className="h-4 w-4 mr-2" />
                      Mic Test
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSpeakerTest}
                  disabled={isTestingMicPlayback || isTestingSpeakers}
                >
                  {isTestingSpeakers ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </div>
                  ) : (
                    "Speaker Test"
                  )}
                </Button>
              </div>
            </div>

            {(microphoneLevel > 0 || isTestingMicPlayback) && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">
                  {isTestingMicPlayback ? "Microphone Level (with playback)" : "Microphone Level"}
                </Label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-150 ${
                      microphoneLevel > 70 ? "bg-red-500" : microphoneLevel > 40 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${microphoneLevel}%` }}
                  />
                </div>
                {isTestingMicPlayback && (
                  <p className="text-xs text-blue-600">
                    Speak into your microphone - you should hear your voice through your speakers
                  </p>
                )}
              </div>
            )}
          </div>

          {callStatus && (
            <div
              className={`p-3 rounded-lg ${
                dialerStatus === "Error" ? "bg-red-50 border border-red-200" : "bg-blue-50"
              }`}
            >
              <p className={`text-sm ${dialerStatus === "Error" ? "text-red-800" : "text-blue-800"}`}>{callStatus}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
