"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Edit,
  Trash2,
  UserPlus,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  PhoneCall,
  Calendar,
  FileText,
  Mic,
  Volume2,
  Settings,
  CheckCircle,
  XCircle,
  Upload,
  ArrowRightLeft,
} from "lucide-react"
import { hasPermission, Permission } from "@/lib/permissions"
import { useAuth } from "@/hooks/use-auth"

interface TelemarketingLead {
  id: number
  company_name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  industry: string | null
  lead_source: string | null
  status:
    | "new"
    | "contacted"
    | "interested"
    | "not_interested"
    | "callback_scheduled"
    | "converted"
    | "converted_to_followup"
    | "dead"
  priority: "low" | "medium" | "high" | "urgent"
  notes: string | null
  last_contact_date: string | null
  next_contact_date: string | null
  assigned_to: number | null
  assigned_to_name?: string
  created_by: number | null
  created_at: string
  updated_at: string
  list_id: number | null
  list_name?: string
  converted_to_vendor_id?: number | null
  converted_to_followup_id?: number | null
  conversion_date?: string | null
  name: string
}

interface LeadList {
  id: number
  name: string
  description: string | null
  created_by: number
  created_by_name: string
  created_at: string
  updated_at: string
  is_active: boolean
  leads_count: number
}

interface TelemarketingUser {
  id: number
  name: string
  email: string
  role: string
}

interface Script {
  id: number
  name: string
  content: string
  listId: number | null
}

export function TelemarketingManagement() {
  const { user: rawUser } = useAuth()
  // Ensure user matches the permissions User type
  const user = rawUser
    ? {
        is_active: true,
        company_tag: "",
        ...rawUser,
      }
    : null
  const [leads, setLeads] = useState<TelemarketingLead[]>([])
  const [users, setUsers] = useState<TelemarketingUser[]>([])
  const [leadLists, setLeadLists] = useState<LeadList[]>([])
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [isAssignLeadOpen, setIsAssignLeadOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<TelemarketingLead | null>(null)
  const [currentLeadIndex, setCurrentLeadIndex] = useState(0)
  const [isConvertToFollowupOpen, setIsConvertToFollowupOpen] = useState(false)
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<TelemarketingLead | null>(null)
  const [isCreateListOpen, setIsCreateListOpen] = useState(false)
  const [scripts, setScripts] = useState<Script[]>([])
  const [isScriptUploadOpen, setIsScriptUploadOpen] = useState(false)
  const [isLeadUploadOpen, setIsLeadUploadOpen] = useState(false)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [isDialerActive, setIsDialerActive] = useState(false)
  const [isDialerPaused, setIsDialerPaused] = useState(false)
  const [isScriptExpanded, setIsScriptExpanded] = useState(false)
  const [currentCallRating, setCurrentCallRating] = useState<number>(0)
  const [callNotes, setCallNotes] = useState("")
  const [script, setScript] = useState(
    "Hello, this is [Your Name] from [Company]. I'm calling to discuss how we can help improve your business operations. Do you have a few minutes to talk about your current challenges and how our services might benefit you?",
  )

  const [isAudioTestOpen, setIsAudioTestOpen] = useState(false)
  const [microphoneStatus, setMicrophoneStatus] = useState<"untested" | "testing" | "passed" | "failed">("untested")
  const [speakerStatus, setSpeakerStatus] = useState<"untested" | "testing" | "passed" | "failed">("untested")
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [isAudioTestPassed, setIsAudioTestPassed] = useState(false)

  const canAssignLeads = hasPermission(user, Permission.ASSIGN_LEADS)
  const canCreateLeads = hasPermission(user, Permission.CREATE_TELEMARKETING)
  const canEditLeads = hasPermission(user, Permission.EDIT_TELEMARKETING)
  const canDeleteLeads = hasPermission(user, Permission.DELETE_TELEMARKETING)
  const canConvertToFollowup = hasPermission(user, Permission.CREATE_FOLLOWUPS)

  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // Database field options for mapping
  const dbFields = [
    { value: "company_name", label: "Company Name *", required: true },
    { value: "contact_person", label: "Contact Person" },
    { value: "phone", label: "Phone" },
    { value: "email", label: "Email" },
    { value: "address", label: "Address" },
    { value: "industry", label: "Industry" },
    { value: "lead_source", label: "Lead Source" },
    { value: "notes", label: "Notes" },
    { value: "", label: "Skip this column" },
  ]

  const [showAddListDialog, setShowAddListDialog] = useState(false)

  useEffect(() => {
    fetchLeadLists()
    fetchLeads()
    fetchUsers()
    fetchScripts()
  }, [selectedListId])

  const fetchLeadLists = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/telemarketing/lead-lists")
      if (response.ok) {
        const data = await response.json()
        setLeadLists(data.leadLists || [])
        if (!selectedListId && data.leadLists?.length > 0) {
          setSelectedListId(data.leadLists[0].id)
        }
      } else {
        console.error("Failed to fetch lead lists:", response.statusText)
        alert("Failed to load lead lists. Please refresh the page.")
      }
    } catch (error) {
      console.error("Error fetching lead lists:", error)
      alert("Network error while loading lead lists. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedListId) {
        params.append("listId", selectedListId.toString())
      }

      const response = await fetch(`/api/telemarketing/leads?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads || [])
      } else {
        console.error("Failed to fetch leads:", response.statusText)
        alert("Failed to load leads. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
      alert("Network error while loading leads. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedListId) {
      fetchLeads()
    }
  }, [selectedListId])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/telemarketing/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      } else {
        console.error("Failed to fetch users:", response.statusText)
        alert("Failed to load users. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Network error while loading users. Please check your connection.")
    }
  }

  const fetchScripts = async () => {
    try {
      const response = await fetch(`/api/telemarketing/scripts${selectedListId ? `?listId=${selectedListId}` : ""}`)
      if (response.ok) {
        const data = await response.json()
        setScripts(data || [])
      } else {
        console.error("Failed to fetch scripts:", response.statusText)
        alert("Failed to load scripts. Please try again.")
      }
    } catch (error) {
      console.error("Error fetching scripts:", error)
      alert("Network error while loading scripts. Please check your connection.")
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default"
      case "contacted":
        return "secondary"
      case "interested":
        return "default"
      case "not_interested":
        return "destructive"
      case "callback_scheduled":
        return "default"
      case "converted":
        return "default"
      case "converted_to_followup":
        return "default"
      case "dead":
        return "outline"
      default:
        return "outline"
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.contact_person && lead.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  useEffect(() => {
    if (filteredLeads.length === 0) {
      setCurrentLeadIndex(0)
    } else if (currentLeadIndex >= filteredLeads.length) {
      setCurrentLeadIndex(Math.max(0, filteredLeads.length - 1))
    }
  }, [filteredLeads.length, currentLeadIndex])

  const currentLead =
    filteredLeads.length > 0 && currentLeadIndex < filteredLeads.length ? filteredLeads[currentLeadIndex] : null

  const getLeadsByStatus = (status: string) => {
    return filteredLeads.filter((lead) => lead.status === status)
  }

  const newLeads = getLeadsByStatus("new")
  const inProgressLeads = filteredLeads.filter((lead) =>
    ["contacted", "interested", "callback_scheduled"].includes(lead.status),
  )
  const convertedLeads = getLeadsByStatus("converted")
  const deadLeads = filteredLeads.filter((lead) => ["not_interested", "dead"].includes(lead.status))

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!selectedListId) {
      alert("Please select a lead list first")
      return
    }

    setCsvFile(file)
    setLoading(true)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const data = lines.slice(1, 6).map((line) => {
        // Preview first 5 rows
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ""
        })
        return row
      })

      setCsvHeaders(headers)
      setCsvData(data)

      // Auto-map common field names
      const autoMapping: Record<string, string> = {}
      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase()
        if (lowerHeader.includes("company") || lowerHeader.includes("business")) {
          autoMapping[header] = "company_name"
        } else if (lowerHeader.includes("contact") || lowerHeader.includes("person") || lowerHeader.includes("name")) {
          autoMapping[header] = "contact_person"
        } else if (lowerHeader.includes("phone") || lowerHeader.includes("tel")) {
          autoMapping[header] = "phone"
        } else if (lowerHeader.includes("email") || lowerHeader.includes("mail")) {
          autoMapping[header] = "email"
        } else if (lowerHeader.includes("address") || lowerHeader.includes("location")) {
          autoMapping[header] = "address"
        } else if (lowerHeader.includes("industry") || lowerHeader.includes("sector")) {
          autoMapping[header] = "industry"
        } else if (lowerHeader.includes("source") || lowerHeader.includes("origin")) {
          autoMapping[header] = "lead_source"
        } else if (lowerHeader.includes("note") || lowerHeader.includes("comment")) {
          autoMapping[header] = "notes"
        }
      })

      setFieldMapping(autoMapping)
      setShowFieldMapping(true)
    } catch (error) {
      console.error("Error processing CSV:", error)
      alert("Error processing CSV file")
    } finally {
      setLoading(false)
    }
  }

  const submitMappedCSV = async () => {
    if (!csvFile || !selectedListId) return

    // Validate required fields are mapped
    const hasCompanyName = Object.values(fieldMapping).includes("company_name")
    if (!hasCompanyName) {
      alert("Company Name is required. Please map at least one column to Company Name.")
      return
    }

    setLoading(true)
    try {
      const text = await csvFile.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const leads = lines
        .slice(1)
        .map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
          const lead: any = { list_id: selectedListId }

          headers.forEach((header, index) => {
            const dbField = fieldMapping[header]
            if (dbField && dbField !== "") {
              lead[dbField] = values[index] || null
            }
          })

          return lead
        })
        .filter((lead) => lead.company_name) // Only include leads with company name

      if (leads.length === 0) {
        alert("No valid leads found. Make sure Company Name is mapped and has data.")
        setLoading(false)
        return
      }

      const response = await fetch("/api/telemarketing/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leads,
          created_by: user?.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully imported ${result.count || leads.length} leads`)
        fetchLeads()
        setIsLeadUploadOpen(false)
        setShowFieldMapping(false)
        setCsvData([])
        setCsvHeaders([])
        setFieldMapping({})
        setCsvFile(null)
      } else {
        const error = await response.json()
        alert(`Failed to import leads: ${error.error}`)
      }
    } catch (error) {
      console.error("Error submitting CSV:", error)
      alert("Error submitting CSV data")
    } finally {
      setLoading(false)
    }
  }

  const handleScriptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!selectedListId) {
      alert("Please select a lead list first before uploading a script.")
      return
    }

    try {
      const content = await file.text()
      const name = file.name.replace(/\.[^/.]+$/, "") // Remove file extension

      const response = await fetch("/api/telemarketing/scripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          content,
          listId: selectedListId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Script "${name}" uploaded successfully`)
        fetchScripts()
        setIsScriptUploadOpen(false)
      } else {
        const error = await response.json()
        alert(`Failed to upload script: ${error.error}`)
      }
    } catch (error) {
      console.error("Error uploading script:", error)
      alert("Error uploading script file")
    }
  }

  const loadScript = (scriptContent: string) => {
    setScript(scriptContent)
    alert("Script loaded successfully")
  }

  const handleConvertToFollowup = async (lead: TelemarketingLead, followUpDate: string, notes: string) => {
    try {
      const response = await fetch(`/api/telemarketing/leads/${lead.id}/convert-to-followup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follow_up_date: followUpDate,
          notes: notes,
          created_by: user?.name || "System",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully converted lead to follow-up! Vendor: ${result.vendor.business_name}`)
        fetchLeads()
        setIsConvertToFollowupOpen(false)
        setSelectedLeadForConversion(null)
      } else {
        const error = await response.json()
        alert(`Failed to convert lead: ${error.error}`)
      }
    } catch (error) {
      console.error("Error converting lead to follow-up:", error)
      alert("Error converting lead to follow-up")
    }
  }

  const handleStartDialer = () => {
    if (!isAudioTestPassed) {
      setIsAudioTestOpen(true)
      return
    }
    setIsDialerActive(true)
    setIsDialerPaused(false)
  }

  const handlePauseDialer = () => {
    setIsDialerPaused(!isDialerPaused)
  }

  const handleStopDialer = () => {
    setIsDialerActive(false)
    setIsDialerPaused(false)
  }

  const goToNextLead = () => {
    if (filteredLeads.length > 0) {
      setCurrentLeadIndex((prev) => (prev + 1) % filteredLeads.length)
    }
  }

  const goToPreviousLead = () => {
    if (filteredLeads.length > 0) {
      setCurrentLeadIndex((prev) => (prev - 1 + filteredLeads.length) % filteredLeads.length)
    }
  }

  const skipCurrentLead = () => {
    goToNextLead()
  }

  const handleNextLead = () => {
    if (currentLeadIndex < filteredLeads.length - 1) {
      setCurrentLeadIndex(currentLeadIndex + 1)
      setCurrentCallRating(0)
      setCallNotes("")
    }
  }

  const handlePreviousLead = () => {
    if (currentLeadIndex > 0) {
      setCurrentLeadIndex(currentLeadIndex - 1)
      setCurrentCallRating(0)
      setCallNotes("")
    }
  }

  const handleClickToCall = async (phoneNumber: string) => {
    if (!phoneNumber) {
      alert("No phone number available")
      return
    }

    try {
      console.log("[v0] Initiating call to:", phoneNumber)

      const response = await fetch("/api/telemarketing/twilio/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          leadId: currentLead?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Call initiated successfully:", data)
        alert(`Call initiated to ${phoneNumber}. Call SID: ${data.callSid}`)

        // Update call notes with call information
        setCallNotes(
          (prev) =>
            prev +
            (prev ? "\n" : "") +
            `[${new Date().toLocaleTimeString()}] Call initiated to ${phoneNumber} (SID: ${data.callSid})`,
        )
      } else {
        console.error("[v0] Call initiation failed:", data)
        alert(`Failed to initiate call: ${data.error}`)
      }
    } catch (error) {
      console.error("[v0] Error initiating call:", error)
      alert("Error initiating call. Please check your connection and try again.")
    }
  }

  const handleScheduleCall = (lead: TelemarketingLead) => {
    // Google Calendar integration
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Call ${lead.company_name}&details=Follow up call with ${lead.contact_person || "contact"} at ${lead.company_name}&dates=${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
    window.open(calendarUrl, "_blank")
  }

  const testMicrophone = async () => {
    setMicrophoneStatus("testing")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)

      // Create audio context for level monitoring
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 256
      microphone.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average)

        if (average > 10) {
          // If we detect audio input
          setTimeout(() => {
            setMicrophoneStatus("passed")
            stream.getTracks().forEach((track) => track.stop())
            audioContext.close()
          }, 2000)
        } else {
          requestAnimationFrame(checkAudioLevel)
        }
      }

      checkAudioLevel()

      // Auto-fail after 10 seconds if no audio detected
      setTimeout(() => {
        if (microphoneStatus === "testing") {
          setMicrophoneStatus("failed")
          stream.getTracks().forEach((track) => track.stop())
          audioContext.close()
        }
      }, 10000)
    } catch (error) {
      console.error("Microphone test failed:", error)
      setMicrophoneStatus("failed")
    }
  }

  const testSpeakers = () => {
    setSpeakerStatus("testing")

    // Play a test tone
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 1)

    // Auto-pass after playing the tone
    setTimeout(() => {
      setSpeakerStatus("passed")
      audioContext.close()
    }, 1500)
  }

  const resetAudioTests = () => {
    setMicrophoneStatus("untested")
    setSpeakerStatus("untested")
    setIsAudioTestPassed(false)
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
      setAudioStream(null)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  useEffect(() => {
    setIsAudioTestPassed(microphoneStatus === "passed" && speakerStatus === "passed")
  }, [microphoneStatus, speakerStatus])

  const [callStatus, setCallStatus] = useState<"idle" | "ringing" | "connected" | "ended">("idle")
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined = undefined

    if (callStatus === "connected") {
      intervalId = setInterval(() => {
        setCallDuration((prevDuration) => prevDuration + 1)
      }, 1000)
    } else {
      if (intervalId !== undefined) clearInterval(intervalId)
      setCallDuration(0)
    }

    return () => {
      if (intervalId !== undefined) clearInterval(intervalId)
    }
  }, [callStatus])

  const formatCallDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const userRole = user?.role || "guest"

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Control Bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Power Dialer</h1>

          {/* Lead List Selector */}
          <Select value={selectedListId?.toString() || ""} onValueChange={(value) => setSelectedListId(Number(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select lead list" />
            </SelectTrigger>
            <SelectContent>
              {leadLists.map((list) => (
                <SelectItem key={list.id} value={list.id.toString()}>
                  {list.name} ({list.leads_count || 0} leads)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Audio Test Status */}
          <div className="flex items-center gap-2">
            <Dialog open={isAudioTestOpen} onOpenChange={setIsAudioTestOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`${isAudioTestPassed ? "border-green-500 text-green-700" : "border-orange-500 text-orange-700"}`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Audio Test
                  {isAudioTestPassed ? (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 ml-2 text-orange-500" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Audio Equipment Test</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Microphone Test */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Microphone Test</Label>
                      <div className="flex items-center gap-2">
                        {microphoneStatus === "passed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {microphoneStatus === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
                        {microphoneStatus === "testing" && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={testMicrophone}
                      disabled={microphoneStatus === "testing"}
                      className="w-full"
                      variant={microphoneStatus === "passed" ? "default" : "outline"}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      {microphoneStatus === "testing" ? "Testing... Speak now!" : "Test Microphone"}
                    </Button>
                    {microphoneStatus === "testing" && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Audio Level:</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-100"
                            style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Speaker Test */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Speaker Test</Label>
                      <div className="flex items-center gap-2">
                        {speakerStatus === "passed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {speakerStatus === "failed" && <XCircle className="h-5 w-5 text-red-500" />}
                        {speakerStatus === "testing" && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={testSpeakers}
                      disabled={speakerStatus === "testing"}
                      className="w-full"
                      variant={speakerStatus === "passed" ? "default" : "outline"}
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      {speakerStatus === "testing" ? "Playing Test Tone..." : "Test Speakers"}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={resetAudioTests} className="flex-1 bg-transparent">
                      Reset Tests
                    </Button>
                    <Button onClick={() => setIsAudioTestOpen(false)} disabled={!isAudioTestPassed} className="flex-1">
                      {isAudioTestPassed ? "Continue" : "Complete Tests First"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Dialer Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isDialerActive ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm font-medium">
              {isDialerActive ? (isDialerPaused ? "Paused" : "Active") : "Stopped"}
            </span>
          </div>
        </div>

        {/* Power Dialer Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isDialerActive ? "destructive" : "default"}
            onClick={isDialerActive ? handleStopDialer : handleStartDialer}
            className="px-6"
            disabled={!isDialerActive && !isAudioTestPassed}
          >
            {isDialerActive ? "Stop Dialer" : "Start Dialer"}
          </Button>

          {isDialerActive && (
            <>
              <Button variant="outline" onClick={handlePauseDialer} className="px-4 bg-transparent">
                {isDialerPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isDialerPaused ? "Resume" : "Pause"}
              </Button>

              <div className="flex items-center gap-1 border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviousLead}
                  disabled={currentLeadIndex === 0}
                  className="px-3"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <span className="px-3 py-2 text-sm font-medium bg-gray-50">
                  {currentLeadIndex + 1} / {filteredLeads.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextLead}
                  disabled={currentLeadIndex >= filteredLeads.length - 1}
                  className="px-3"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Dialog open={isLeadUploadOpen} onOpenChange={setIsLeadUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Leads
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Leads (CSV)</DialogTitle>
                </DialogHeader>

                {!showFieldMapping ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Upload a CSV file with lead information. You'll be able to map columns to database fields in the
                      next step.
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Map CSV Columns to Database Fields</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Map your CSV columns to the appropriate database fields. Company Name is required.
                      </p>
                    </div>

                    {/* Field Mapping */}
                    <div className="grid grid-cols-2 gap-4">
                      {csvHeaders.map((header) => (
                        <div key={header} className="flex items-center space-x-2">
                          <label className="text-sm font-medium w-32 truncate" title={header}>
                            {header}:
                          </label>
                          <select
                            value={fieldMapping[header] || ""}
                            onChange={(e) =>
                              setFieldMapping((prev) => ({
                                ...prev,
                                [header]: e.target.value,
                              }))
                            }
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          >
                            {dbFields.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* Data Preview */}
                    <div>
                      <h4 className="text-md font-semibold mb-2">Data Preview (First 5 rows)</h4>
                      <div className="border rounded overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {csvHeaders.map((header) => (
                                <th key={header} className="px-2 py-1 text-left border-r">
                                  {header}
                                  {fieldMapping[header] && (
                                    <div className="text-xs text-blue-600 font-normal">
                                      → {dbFields.find((f) => f.value === fieldMapping[header])?.label}
                                    </div>
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.map((row, index) => (
                              <tr key={index} className="border-t">
                                {csvHeaders.map((header) => (
                                  <td key={header} className="px-2 py-1 border-r">
                                    {row[header]}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowFieldMapping(false)
                          setCsvData([])
                          setCsvHeaders([])
                          setFieldMapping({})
                          setCsvFile(null)
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={submitMappedCSV}
                        disabled={loading || !Object.values(fieldMapping).includes("company_name")}
                      >
                        {loading ? "Importing..." : "Import Leads"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isScriptUploadOpen} onOpenChange={setIsScriptUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Script
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Script</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Upload a text file containing your call script</p>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleScriptUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4">
        {/* Lead Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Lead Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.company_name}</TableCell>
                <TableCell>{lead.contact_person || "N/A"}</TableCell>
                <TableCell>{lead.phone || "N/A"}</TableCell>
                <TableCell>{lead.email || "N/A"}</TableCell>
                <TableCell>{lead.industry || "N/A"}</TableCell>
                <TableCell>{lead.lead_source || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(lead.priority)}>{lead.priority}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canEditLeads && (
                      <Button variant="outline" onClick={() => setSelectedLead(lead)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canAssignLeads && (
                      <Button variant="outline" onClick={() => setSelectedLead(lead)}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteLeads && (
                      <Button variant="destructive" onClick={() => console.log("Delete lead", lead.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {canConvertToFollowup && (
                      <Button variant="outline" onClick={() => setSelectedLeadForConversion(lead)}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => handleClickToCall(lead.phone || "")}>
                      <PhoneCall className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleScheduleCall(lead)}>
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
