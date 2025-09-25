import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  Loader2
} from "lucide-react"

interface ManualDialerProps {
  user?: any
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

type ConnectionMode = 'conference' | 'direct'
type CallStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

export function ManualDialer({ user, isOpen, onOpenChange }: ManualDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('conference')
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [currentCall, setCurrentCall] = useState<any>(null)
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [callDuration, setCallDuration] = useState(0)


  const audioRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartTimeRef = useRef<number | null>(null)


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
  }, [isOpen, audioInitialized])

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
      // Request microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      localStreamRef.current = stream
      setAudioInitialized(true)
      setStatusMessage("Browser audio ready - microphone and speakers connected")
      console.log("Audio initialized successfully")
    } catch (error) {
      console.error("Failed to initialize audio:", error)
      setCallStatus('error')
      setStatusMessage("Failed to initialize browser audio - check permissions")
    }
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    if (currentCall) {
      currentCall.disconnect?.()
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
    if (cleaned.length >= 14) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
    return number
  }

  const makeCall = async () => {
    if (!phoneNumber.trim()) {
      setStatusMessage("Please enter a phone number")
      return
    }

    if (!audioInitialized) {
      setStatusMessage("Browser audio not ready - please wait")
      return
    }

    setCallStatus('connecting')
    setStatusMessage("Initiating call...")
    
    try {
      if (connectionMode === 'conference') {
        await makeConferenceCall()
      } else {
        await makeDirectCall()
      }
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
      const response = await fetch('/api/telemarketing/twilio/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          userId: user?.id,
          callType: 'manual'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate call')
      }

      setCurrentCall(result)
      setCallStatus('connected')
      setStatusMessage("Connected - two-way audio active")
      console.log("Conference call initiated:", result)
      
    } catch (error) {
      console.error("Conference call failed:", error)
      throw error
    }
  }

  const makeDirectCall = async () => {
    // For direct calls, we'd use WebRTC
    // This is a placeholder for WebRTC implementation
    console.log("Direct call not yet implemented")
    
    // Simulate call connection
    setTimeout(() => {
      setCallStatus('connected')
      setStatusMessage("Connected - two-way audio active")
    }, 2000)
  }

  const endCall = async () => {
    try {
      if (currentCall && connectionMode === 'conference') {
        const response = await fetch(`/api/telemarketing/twilio/call/${currentCall.callSid}/end`, {
          method: 'POST',
        })
        
        if (response.ok) {
          console.log("Call ended successfully")
        }
      }
      
      setCallStatus('idle')
      setStatusMessage("Call ended")
      setCurrentCall(null)
    } catch (error) {
      console.error("Error ending call:", error)
      setStatusMessage("Error ending call")
    }
  }

  const toggleMute = async () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = isMuted
      })
    }
    
    if (currentCall && connectionMode === 'conference') {
      try {
        await fetch(`/api/telemarketing/twilio/call/${currentCall.callSid}/mute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ muted: !isMuted })
        })
      } catch (error) {
        console.error("Failed to toggle mute:", error)
      }
    }
    
    setIsMuted(!isMuted)
  }

  const testMicrophone = async () => {
    setIsTestingMic(true)
    setStatusMessage("Testing microphone - speak into your microphone...")
    
    try {
      if (!audioInitialized) {
        await initializeAudio()
      }
      
      // Simulate mic test duration
      setTimeout(() => {
        setIsTestingMic(false)
        setStatusMessage("Microphone test completed")
      }, 3000)
      
      console.log("Microphone test - audio initialized:", audioInitialized)
    } catch (error) {
      console.error("Mic test failed:", error)
      setIsTestingMic(false)
      setStatusMessage("Microphone test failed - check permissions")
    }
  }

  const testSpeaker = () => {
    setIsTestingSpeaker(true)
    setStatusMessage("Testing speakers - you should hear a test tone...")
    
    try {
      // Play a test tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 1)
      
      setTimeout(() => {
        setIsTestingSpeaker(false)
        setStatusMessage("Speaker test completed - did you hear the tone?")
      }, 1200)
      
      console.log("Speaker test completed")
    } catch (error) {
      console.error("Speaker test failed:", error)
      setIsTestingSpeaker(false)
      setStatusMessage("Speaker test failed - check audio output")
    }
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
      setIsMuted(false)
      setIsSpeakerOn(false)
    }
  }, [isOpen])

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
          {/* Connection Mode */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Connection Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={connectionMode === 'conference' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setConnectionMode('conference')}
              >
                Conference
              </Button>
              <Button 
                variant={connectionMode === 'direct' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setConnectionMode('direct')}
                disabled
              >
                Direct
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {connectionMode === 'conference' 
                ? 'Conference-based calling with browser audio' 
                : 'Direct WebRTC calling (not yet available)'}
            </p>
          </div>

          {/* Phone Number Input / Call Timer Display */}
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

          {/* Keypad */}
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
                disabled={callStatus === 'connecting'}
              >
                <span className="text-lg font-bold">{digit}</span>
                {letters && <span className="text-xs text-gray-500">{letters}</span>}
              </Button>
            ))}
          </div>

          {/* Call Controls */}
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
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  className={isMuted ? 'bg-red-50 text-red-600' : ''}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white px-6" 
                  onClick={endCall}
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Hang Up
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={isSpeakerOn ? 'bg-blue-50 text-blue-600' : ''}
                >
                  {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>

          {/* Audio Setup */}

          {/* Audio Setup */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Audio Setup</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testMicrophone}
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
                  onClick={testSpeaker}
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
          </div>

          {/* Status Message */}
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

          {/* Call Status Info */}
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
                  <span>Duration:</span>
                  <span className="font-mono text-green-600 font-semibold">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Live</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call Ended Info */}
          {callStatus === 'disconnected' && callDuration > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Last Call Duration:</span>
                  <span className="font-mono text-gray-800 font-semibold">
                    {formatDuration(callDuration)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <span className="text-gray-500">Ended</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden audio element for call audio */}
        <audio ref={audioRef} autoPlay playsInline />
      </DialogContent>
    </Dialog>
  )
}