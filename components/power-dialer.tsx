"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  SkipForward, 
  PhoneCall,
  PhoneOff,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

interface Contact {
  id: string
  name: string
  phone: string
  company?: string
  status: "pending" | "calling" | "connected" | "answered" | "no-answer" | "busy" | "failed"
}

interface PowerDialerProps {
  contacts: Contact[]
  onCall?: (contact: Contact) => void
  onStatusUpdate?: (contactId: string, status: Contact["status"]) => void
}

interface CallState {
  isActive: boolean
  callSid: string | null
  contact: Contact | null
  duration: number
  error: string | null
}

export function PowerDialer({ contacts = [], onCall, onStatusUpdate }: PowerDialerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoDialing, setIsAutoDialing] = useState(false)
  const [dialingSpeed, setDialingSpeed] = useState(5)
  const [localContacts, setLocalContacts] = useState<Contact[]>(contacts)
  const [isProcessing, setIsProcessing] = useState(false)
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    callSid: null,
    contact: null,
    duration: 0,
    error: null
  })
  
  const autoDialTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const callStartTimeRef = useRef<number | null>(null)
  const isAutoDialingRef = useRef(false) // Use ref to avoid closure issues

  // Keep ref in sync with state
  useEffect(() => {
    isAutoDialingRef.current = isAutoDialing
  }, [isAutoDialing])

  // Update local contacts when props change
  useEffect(() => {
    setLocalContacts(contacts)
  }, [contacts])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoDialTimerRef.current) {
        clearTimeout(autoDialTimerRef.current)
      }
      if (callDurationTimerRef.current) {
        clearInterval(callDurationTimerRef.current)
      }
    }
  }, [])

  // Auto-dialer effect - this is the main auto-dialing logic
  useEffect(() => {
    if (!isAutoDialing) return

    const startAutoDialing = async () => {
      console.log("[PowerDialer] Starting auto-dial sequence at index:", currentIndex)
      
      // Get current contact
      const contact = localContacts[currentIndex]
      if (!contact) {
        console.log("[PowerDialer] No contact found, stopping auto-dial")
        setIsAutoDialing(false)
        return
      }

      // Skip if already processed
      if (contact.status !== 'pending') {
        console.log("[PowerDialer] Contact already processed, moving to next")
        const nextIndex = currentIndex + 1
        if (nextIndex < localContacts.length) {
          setCurrentIndex(nextIndex)
        } else {
          console.log("[PowerDialer] Reached end of list, stopping auto-dial")
          setIsAutoDialing(false)
        }
        return
      }

      // Make the call
      try {
        await makeCall(contact)
        
        // Schedule next call
        autoDialTimerRef.current = setTimeout(() => {
          if (isAutoDialingRef.current) {
            const nextIndex = currentIndex + 1
            if (nextIndex < localContacts.length) {
              console.log("[PowerDialer] Auto-advancing to index:", nextIndex)
              endCall() // End current call
              setCurrentIndex(nextIndex) // This will trigger the effect again
            } else {
              console.log("[PowerDialer] Reached end of contacts, stopping auto-dial")
              setIsAutoDialing(false)
            }
          }
        }, dialingSpeed * 1000)

      } catch (error) {
        console.error("[PowerDialer] Call failed, moving to next after delay")
        setTimeout(() => {
          if (isAutoDialingRef.current) {
            const nextIndex = currentIndex + 1
            if (nextIndex < localContacts.length) {
              setCurrentIndex(nextIndex)
            } else {
              setIsAutoDialing(false)
            }
          }
        }, 2000)
      }
    }

    // Only start if not currently calling
    if (!callState.isActive && !isProcessing) {
      startAutoDialing()
    }

  }, [isAutoDialing, currentIndex, localContacts, callState.isActive, isProcessing, dialingSpeed])

  // Call duration timer
  useEffect(() => {
    if (callState.isActive && !callDurationTimerRef.current) {
      callStartTimeRef.current = Date.now()
      callDurationTimerRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
          setCallState(prev => ({ ...prev, duration: elapsed }))
        }
      }, 1000)
    }

    if (!callState.isActive && callDurationTimerRef.current) {
      clearInterval(callDurationTimerRef.current)
      callDurationTimerRef.current = null
      callStartTimeRef.current = null
    }
  }, [callState.isActive])

  const currentContact = localContacts[currentIndex]

  const updateContactStatus = (contactId: string, status: Contact["status"]) => {
    setLocalContacts(prev => 
      prev.map(contact => 
        contact.id === contactId ? { ...contact, status } : contact
      )
    )
    if (onStatusUpdate) {
      onStatusUpdate(contactId, status)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const handlePrevious = () => {
    if (callState.isActive || isAutoDialing) return
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    if (callState.isActive || isAutoDialing) return
    setCurrentIndex((prev) => Math.min(localContacts.length - 1, prev + 1))
  }

  const makeCall = async (contact: Contact) => {
    if (isProcessing) {
      console.log("[PowerDialer] Already processing, skipping call")
      return
    }

    if (callState.isActive) {
      console.log("[PowerDialer] Call already active")
      return
    }

    try {
      setIsProcessing(true)
      updateContactStatus(contact.id, "calling")
      
      setCallState({
        isActive: true,
        callSid: null,
        contact: contact,
        duration: 0,
        error: null
      })

      console.log("[PowerDialer] Initiating call to:", contact.phone)

      const response = await fetch('/api/telemarketing/twilio/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: contact.phone,
          leadId: contact.id,
          contactName: contact.name,
          contactCompany: contact.company,
          callType: 'power_dialer'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to initiate call: ${response.status}`)
      }

      console.log("[PowerDialer] Call initiated successfully:", result)

      setCallState(prev => ({
        ...prev,
        callSid: result.data?.sid || result.callSid
      }))

      updateContactStatus(contact.id, "connected")

      if (onCall) {
        onCall(contact)
      }

    } catch (error) {
      console.error("[PowerDialer] Call failed:", error)
      
      setCallState({
        isActive: false,
        callSid: null,
        contact: null,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })

      updateContactStatus(contact.id, "failed")
      throw error // Re-throw to handle in auto-dial logic

    } finally {
      setIsProcessing(false)
    }
  }

  const endCall = async () => {
    try {
      console.log("[PowerDialer] Ending call:", callState.callSid)
      
      if (callState.callSid) {
        const response = await fetch(`/api/telemarketing/twilio/call/${callState.callSid}/end`, {
          method: 'POST',
        })

        if (response.ok) {
          console.log("[PowerDialer] Call ended successfully")
        }
      }

      if (callState.contact) {
        updateContactStatus(callState.contact.id, "answered")
      }

    } catch (error) {
      console.error("[PowerDialer] Error ending call:", error)
    } finally {
      setCallState({
        isActive: false,
        callSid: null,
        contact: null,
        duration: 0,
        error: null
      })

      if (autoDialTimerRef.current) {
        clearTimeout(autoDialTimerRef.current)
        autoDialTimerRef.current = null
      }
    }
  }

  const handleCall = () => {
    if (callState.isActive) {
      endCall()
    } else if (currentContact) {
      makeCall(currentContact)
    }
  }

  const handleSkip = () => {
    if (callState.isActive) {
      endCall()
    }
    
    if (currentContact) {
      updateContactStatus(currentContact.id, "no-answer")
    }
    
    handleNext()
  }

  const toggleAutoDial = () => {
    console.log("[PowerDialer] Toggling auto-dial from:", isAutoDialing, "to:", !isAutoDialing)
    
    if (autoDialTimerRef.current) {
      clearTimeout(autoDialTimerRef.current)
      autoDialTimerRef.current = null
    }
    
    if (isAutoDialing) {
      // Stopping auto-dial
      setIsAutoDialing(false)
      if (callState.isActive) {
        endCall()
      }
    } else {
      // Starting auto-dial
      setIsAutoDialing(true)
      // The useEffect will handle starting the sequence
    }
  }

  const getStatusBadgeVariant = (status: Contact["status"]) => {
    switch (status) {
      case "answered":
      case "connected":
        return "default"
      case "calling":
        return "secondary"
      case "no-answer":
      case "busy":
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: Contact["status"]) => {
    switch (status) {
      case "answered":
      case "connected":
        return <CheckCircle className="h-3 w-3" />
      case "calling":
        return <Phone className="h-3 w-3 animate-pulse" />
      case "failed":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  if (!localContacts.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No contacts available for dialing</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            Power Dialer
            {isAutoDialing && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-normal">Auto-dialing</span>
              </div>
            )}
          </div>
          <Badge variant="outline">
            {currentIndex + 1} of {localContacts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {callState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{callState.error}</AlertDescription>
          </Alert>
        )}

        {/* Active Call Display */}
        {callState.isActive && callState.contact && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Call Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-mono text-green-700 font-bold">
                  {formatDuration(callState.duration)}
                </span>
              </div>
            </div>
            <p className="text-green-700">
              Connected to {callState.contact.name} ({formatPhoneNumber(callState.contact.phone)})
            </p>
            {callState.contact.company && (
              <p className="text-sm text-green-600">{callState.contact.company}</p>
            )}
          </div>
        )}

        {/* Current Contact Display */}
        {!callState.isActive && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{currentContact?.name || "Unknown"}</h3>
              <Badge variant={getStatusBadgeVariant(currentContact?.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(currentContact?.status)}
                  {currentContact?.status || "pending"}
                </div>
              </Badge>
            </div>
            <p className="text-gray-600 mb-1">{formatPhoneNumber(currentContact?.phone || "")}</p>
            {currentContact?.company && (
              <p className="text-sm text-gray-500">{currentContact.company}</p>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevious} 
            disabled={currentIndex === 0 || callState.isActive || isAutoDialing}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAutoDial}
              className={isAutoDialing ? "bg-blue-100 border-blue-300" : ""}
            >
              {isAutoDialing ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Stop Auto
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Auto Dial
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSkip}
              disabled={!currentContact || isAutoDialing}
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNext} 
            disabled={currentIndex === localContacts.length - 1 || callState.isActive || isAutoDialing}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Call Button */}
        <Button
          className={callState.isActive 
            ? "w-full bg-red-600 hover:bg-red-700 text-white" 
            : "w-full bg-green-600 hover:bg-green-700 text-white"
          }
          onClick={handleCall}
          disabled={!currentContact || isAutoDialing}
        >
          {callState.isActive ? (
            <>
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              Call {currentContact?.name}
            </>
          )}
        </Button>

        {/* Auto-dial Settings */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Call Duration</label>
            <span className="text-sm text-gray-600">{dialingSpeed}s per call</span>
          </div>
          <Input
            type="range"
            min="5"
            max="60"
            value={dialingSpeed}
            onChange={(e) => setDialingSpeed(Number(e.target.value))}
            className="w-full"
            disabled={isAutoDialing}
          />
          <p className="text-xs text-blue-600 mt-1">
            Auto-dialer will spend {dialingSpeed} seconds on each call before moving to the next
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(((currentIndex + 1) / localContacts.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / localContacts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold text-green-600">
              {localContacts.filter(c => c.status === 'answered' || c.status === 'connected').length}
            </div>
            <div className="text-gray-500">Answered</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">
              {localContacts.filter(c => c.status === 'no-answer' || c.status === 'busy').length}
            </div>
            <div className="text-gray-500">No Answer</div>
          </div>
          <div>
            <div className="font-semibold text-red-600">
              {localContacts.filter(c => c.status === 'failed').length}
            </div>
            <div className="text-gray-500">Failed</div>
          </div>
          <div>
            <div className="font-semibold text-gray-600">
              {localContacts.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-gray-500">Pending</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}