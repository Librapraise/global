"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, PhoneOff, ArrowLeft, Mic, Loader2 } from "lucide-react"

interface ManualDialerProps {
  user?: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export function ManualDialer({ user, isOpen, onOpenChange }: ManualDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [statusMessage, setStatusMessage] = useState("")
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false)
  const [microphoneLevel, setMicrophoneLevel] = useState(0)
  const [currentCall, setCurrentCall] = useState<any>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [twilioDevice, setTwilioDevice] = useState<any>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartTimeRef = useRef<number | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Initialize audio when component mounts
  useEffect(() => {
    if (isOpen && !audioInitialized) {
      setStatusMessage("Initializing browser audio...")
      initializeAudio()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  // Call duration timer effect
  useEffect(() => {
    if (callStatus === 'connected' && !callTimerRef.current) {
      callStartTimeRef.current = Date.now()
      callTimerRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
          setCallDuration(elapsed)
        }
      }, 1000)
    }

    if (callStatus !== 'connected' && callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
      if (callStatus === 'idle' || callStatus === 'disconnected') {
        setCallDuration(0)
        callStartTimeRef.current = null
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [callStatus])

  const initializeAudio = async () => {
    try {
      console.log("Initializing audio...")
      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      localStreamRef.current = stream
      
      // Initialize Twilio Device
      await initializeTwilioDevice()
      
      setAudioInitialized(true)
      setStatusMessage("Browser audio ready - microphone and speakers connected")
      console.log("Audio initialized successfully")
    } catch (error) {
      console.error("Failed to initialize audio:", error)
      setCallStatus('error')
      setStatusMessage("Failed to initialize browser audio - check permissions")
    }
  }

  const initializeTwilioDevice = async () => {
    try {
      console.log("Importing Twilio Voice SDK...")
      const TwilioVoice = await import('@twilio/voice-sdk').catch(err => {
        console.error("Failed to import @twilio/voice-sdk:", err)
        throw new Error("Twilio Voice SDK not available")
      })
      
      const { Device } = TwilioVoice
      
      // Get initial token (we'll get a fresh one for each call)
      console.log("Getting Twilio token...")
      const tokenResponse = await fetch('/api/telemarketing/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: `agent-${user?.id || 'default'}`
        })
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to get Twilio token")
      }

      const tokenData = await tokenResponse.json()
      console.log("Creating Twilio Device...")
      
      const device = new Device(tokenData.token, {
        codecPreferences: ['opus', 'pcmu'],
        enableRingingState: true,
        logLevel: 1
      })

      // Set up event handlers
      device.on('ready', () => {
        console.log('Twilio Device ready')
      })

      device.on('error', (error) => {
        console.error('Twilio Device error:', error)
        setStatusMessage(`Device error: ${error.message}`)
        setCallStatus('error')
      })

      device.on('connect', (conn) => {
        console.log('Agent connected to conference')
        setCallStatus('connected')
        setStatusMessage("Connected - two-way audio active")
      })

      device.on('disconnect', (conn) => {
        console.log('Agent disconnected from conference')
        setCallStatus('idle')
        setStatusMessage("Call ended")
        setCurrentCall(null)
      })

      console.log("Registering Twilio Device...")
      await device.register()
      
      setTwilioDevice(device)
      console.log("Twilio Device initialized and registered")
      
    } catch (error) {
      console.error("Failed to initialize Twilio Device:", error)
      throw error
    }
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop())
      micStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (currentCall) {
      currentCall.disconnect?.()
    }
    if (twilioDevice) {
      twilioDevice.destroy()
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
    setAudioInitialized(false)
    setCallStatus('idle')
    setCallDuration(0)
    callStartTimeRef.current = null
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      setStatusMessage("Please enter a phone number")
      return
    }

    if (!audioInitialized || !twilioDevice) {
      setStatusMessage("Browser audio not ready - please wait")
      return
    }

    setCallStatus('connecting')
    setStatusMessage("Initiating call...")
    
    try {
      await makeConferenceCall()
    } catch (error) {
      console.error("Call failed:", error)
      setCallStatus('error')
      setStatusMessage(`Call failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      setTimeout(() => {
        setCallStatus('idle')
        setStatusMessage("Ready for next call")
      }, 3000)
    }
  }

  const makeConferenceCall = async () => {
    try {
      // Format phone number to E.164 format
      const cleanNumber = phoneNumber.replace(/\D/g, '')
      let formattedNumber = cleanNumber
      
      // If it's 10 digits, add +1 (US/Canada)
      if (cleanNumber.length === 10) {
        formattedNumber = `+1${cleanNumber}`
      }
      // If it's 11 digits and starts with 1, add +
      else if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
        formattedNumber = `+${cleanNumber}`
      }
      // If it already has +, use as is
      else if (phoneNumber.startsWith('+')) {
        formattedNumber = `+${cleanNumber}`
      }
      // Otherwise, assume US and add +1
      else if (cleanNumber.length > 0) {
        formattedNumber = `+1${cleanNumber.slice(-10)}` // Take last 10 digits
      }
      
      console.log("Formatted phone number:", formattedNumber)
      
      // Generate a unique conference ID for this call
      const conferenceId = `manual-${Date.now()}-${user?.id || 'agent'}`
      
      console.log("Making call to customer with conference:", conferenceId)
      
      const response = await fetch('/api/telemarketing/twilio/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedNumber,
          userId: user?.id,
          callType: 'manual',
          connectionMode: 'conference',
          conferenceId: conferenceId,
          agentBrowserConnection: true
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate call')
      }

      console.log("Customer call initiated:", result.callSid)
      
      // Now connect the agent's browser to the same conference
      setStatusMessage("Connecting agent to conference...")
      await connectAgentToConference(conferenceId, result.callSid)
      
      console.log("Agent connected to conference - call active")
      
    } catch (error) {
      console.error("Conference call failed:", error)
      throw error
    }
  }

  const connectAgentToConference = async (conferenceId: string, callSid: string) => {
    try {
      console.log("[Agent] Connecting agent browser to conference:", conferenceId)
      
      // Get a fresh token for this call
      console.log("[Agent] Requesting fresh token...")
      const tokenResponse = await fetch('/api/telemarketing/twilio/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity: `agent-${user?.id || 'default'}`,
          conferenceId: conferenceId
        })
      })

      console.log("[Agent] Token response status:", tokenResponse.status)

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}))
        console.error("[Agent] Token request failed:", errorData)
        throw new Error(`Failed to get Twilio token: ${errorData.error || tokenResponse.statusText}`)
      }

      const tokenData = await tokenResponse.json()
      console.log("[Agent] Token received, updating device...")
      
      // Update device with new token
      if (tokenData.token && twilioDevice) {
        try {
          await twilioDevice.updateToken(tokenData.token)
          console.log("[Agent] Device token updated successfully")
        } catch (updateError) {
          console.error("[Agent] Failed to update token:", updateError)
          throw new Error(`Token update failed: ${updateError.message}`)
        }
      } else {
        throw new Error("No token received or device not initialized")
      }
      
      console.log("[Agent] Attempting to connect to conference with ID:", conferenceId)
      console.log("[Agent] Device state:", {
        isInitialized: !!twilioDevice,
        state: twilioDevice?.state,
        isBusy: twilioDevice?.isBusy
      })
      
      const connectOptions = {
        params: {
          conferenceId: conferenceId
        }
      }
      
      console.log("[Agent] Connect options:", JSON.stringify(connectOptions))
      
      const connection = await twilioDevice.connect(connectOptions)
      console.log("[Agent] Connection object received:", !!connection)
      
      setCurrentCall({ connection, conferenceId, callSid })
      console.log("[Agent] Successfully connected to conference")
      
    } catch (error) {
      console.error("[Agent] Failed to connect agent to conference - Full error:", error)
      console.error("[Agent] Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      })
      throw error
    }
  }

  const endCall = async () => {
    try {
      if (currentCall) {
        if (currentCall.connection) {
          currentCall.connection.disconnect()
        }
        
        // Also try to end the call via API
        if (currentCall.callSid) {
          await fetch(`/api/telemarketing/twilio/call/${currentCall.callSid}/end`, {
            method: 'POST',
          }).catch(err => console.error("Error ending call via API:", err))
        }
      }
      
      setCallStatus('idle')
      setStatusMessage("Call ended")
      setCurrentCall(null)
    } catch (error) {
      console.error("Error ending call:", error)
      setStatusMessage("Error ending call")
      setCallStatus('idle')
      setCurrentCall(null)
    }
  }

  const handleMicrophonePlaybackTest = async () => {
    setIsTestingMic(true)
    setStatusMessage("Testing microphone playback - speak into your microphone...")

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
        setIsTestingMic(false)
        setMicrophoneLevel(0)
        setStatusMessage("Microphone playback test completed")
        micStreamRef.current = null
        audioContextRef.current = null
      }, 5000)
    } catch (error) {
      console.error("Microphone test failed:", error)
      setIsTestingMic(false)
      setStatusMessage("Microphone test failed - check permissions")
    }
  }

  const handleSpeakerTest = async () => {
    setIsTestingSpeaker(true)
    setStatusMessage("Testing speakers - you should hear a test tone...")

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
        setIsTestingSpeaker(false)
        setStatusMessage("Speaker test completed - did you hear the tone?")
        audioContextRef.current = null
      }
    } catch (error) {
      console.error("Speaker test failed:", error)
      setIsTestingSpeaker(false)
      setStatusMessage("Speaker test failed - check audio output")
    }
  }

  const handleKeypadPress = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit)
    }
  }

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1))
  }

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '')
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
    return number
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'bg-yellow-500'
      case 'connected': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDialerStatus = () => {
    switch (callStatus) {
      case 'connecting': return 'Calling'
      case 'connected': return 'Connected'
      case 'error': return 'Error'
      default: return 'Ready'
    }
  }

  // Reset states when dialog closes
  useEffect(() => {
    if (!isOpen) {
      cleanup()
      setPhoneNumber("")
      setCurrentCall(null)
      setStatusMessage("")
    }
  }, [isOpen])

  const isCallActive = callStatus === 'connected'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Manual Dialer
            <Badge variant="outline" className={`${getStatusColor()} text-white border-0`}>
              {getDialerStatus()}
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

          {callStatus === 'connected' ? (
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-green-600 bg-green-50 py-4 px-6 rounded-lg border border-green-200">
                  {formatDuration(callDuration)}
                </div>
                <div className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Call in progress to {formatPhoneNumber(phoneNumber)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={formatPhoneNumber(phoneNumber)}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg font-mono"
                maxLength={14}
                disabled={callStatus === 'connecting'}
              />
            </div>
          )}

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
                disabled={callStatus === 'connecting' || isCallActive}
              >
                <span className="text-lg font-bold">{digit}</span>
                {letters && <span className="text-xs text-gray-500">{letters}</span>}
              </Button>
            ))}
          </div>

          <div className="flex justify-center space-x-2">
            {callStatus === 'idle' || callStatus === 'error' ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackspace} 
                  disabled={!phoneNumber}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                  onClick={makeCall}
                  disabled={!phoneNumber || !audioInitialized || callStatus === 'connecting'}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {callStatus === 'connecting' ? "Calling..." : "Call"}
                </Button>
              </>
            ) : (
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white px-6" 
                onClick={endCall}
              >
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
                  disabled={isTestingMic || isTestingSpeaker}
                >
                  {isTestingMic ? (
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
                  disabled={isTestingMic || isTestingSpeaker}
                >
                  {isTestingSpeaker ? (
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

            {(microphoneLevel > 0 || isTestingMic) && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">
                  {isTestingMic ? "Microphone Level (with playback)" : "Microphone Level"}
                </Label>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-150 ${
                      microphoneLevel > 70 ? "bg-red-500" : microphoneLevel > 40 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${microphoneLevel}%` }}
                  />
                </div>
                {isTestingMic && (
                  <p className="text-xs text-blue-600">
                    Speak into your microphone - you should hear your voice through your speakers
                  </p>
                )}
              </div>
            )}
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg ${
                callStatus === 'error' ? "bg-red-50 border border-red-200" : "bg-blue-50"
              }`}
            >
              <p className={`text-sm ${callStatus === 'error' ? "text-red-800" : "text-blue-800"}`}>
                {statusMessage}
              </p>
            </div>
          )}

          {callStatus === 'connected' && currentCall && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Call ID:</span>
                  <span className="font-mono text-xs">
                    {currentCall.callSid?.slice(-8) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Conference:</span>
                  <span className="font-mono text-xs">
                    {currentCall.conferenceId?.slice(-8) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Duration:</span>
                  <span className="font-mono text-green-600 font-semibold">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Live - Conference Call</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}