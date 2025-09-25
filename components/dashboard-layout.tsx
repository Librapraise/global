"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  Users,
  FileText,
  Settings,
  Shield,
  Bell,
  ChevronRight,
  Mail,
  MessageSquare,
  Bot,
  ExternalLink,
  LinkIcon,
  Send,
  X,
  Minimize2,
  Maximize2,
  LogOut,
  Phone,
  PhoneOff,
  Pause,
  ChevronLeft,
} from "lucide-react"
import Link from "next/link"
import { hasPermission, Permission, type User } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermissions } from "@/hooks/use-permissions"
import { ManualDialer } from "@/components/manual-dialer"

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface Vendor {
  id: number
  name: string
  email: string
  phone: string
  business_name: string
  representative: string
  Representative_2: string
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user: permissionsUser, isAdmin } = usePermissions()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGrokOpen, setIsGrokOpen] = useState(true)
  const [isGrokMinimized, setIsGrokMinimized] = useState(false)
  const [grokMessage, setGrokMessage] = useState("")
  const [grokMessages, setGrokMessages] = useState<Array<{ id: number; text: string; sender: "user" | "grok" }>>([
    { id: 1, text: "Hello! I'm Grok, your AI assistant. How can I help you today?", sender: "grok" },
  ])
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [smsRecipientType, setSmsRecipientType] = useState<"all" | "select" | "other">("all")
  const [emailRecipientType, setEmailRecipientType] = useState<"all" | "select" | "other">("all")
  const [selectedVendors, setSelectedVendors] = useState<number[]>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [selectedSingleEmailVendor, setSelectedSingleEmailVendor] = useState<string>("")
  const [selectedSingleSmsVendor, setSelectedSingleSmsVendor] = useState<string>("")
  const [singleEmailType, setSingleEmailType] = useState<"vendor" | "other">("vendor")
  const [singleSmsType, setSingleSmsType] = useState<"vendor" | "other">("vendor")
  const [isGrokLoading, setIsGrokLoading] = useState(false)
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [speakerTest, setSpeakerTest] = useState<{
    volume: number
    isPlaying: boolean
  }>({
    volume: 0.5,
    isPlaying: false,
  })
  const [isDialerOpen, setIsDialerOpen] = useState(false)
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  const [microphoneLevel, setMicrophoneLevel] = useState(0)
  const [callStatus, setCallStatus] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  const [currentLead, setCurrentLead] = useState<any>(null)
  const [scripts, setScripts] = useState<any[]>([])
  const [leadQueue, setLeadQueue] = useState<any[]>([])
  const [dispositions, setDispositions] = useState<any[]>([])
  const [isLoadingLead, setIsLoadingLead] = useState(false)
  const [micTest, setMicTest] = useState({
    isActive: false,
    volume: 0,
    isRecording: false,
  })

  const [isCallActive, setIsCallActive] = useState(false)
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null)
  const [isMicTesting, setIsMicTesting] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadCurrentLead()
    loadScripts()
    loadLeadQueue()
    loadDispositions()
  }, [])

  const fetchVendors = async () => {
    if (vendors.length > 0) return // Already loaded

    setLoadingVendors(true)
    try {
      const url = new URL("/api/vendors", window.location.origin)
      url.searchParams.set("limit", "1000")

      const currentUser =
        permissionsUser || user || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null)

      let userIsAdmin = false
      if (currentUser) {
        userIsAdmin =
          currentUser.is_admin === true || currentUser.role === "admin" || currentUser.role === "super_admin"

        if (userIsAdmin) {
          url.searchParams.set("isAdmin", "true")
        } else {
          url.searchParams.set("isAdmin", "false")
          url.searchParams.set("representative", currentUser.email)
        }
      } else {
        url.searchParams.set("isAdmin", "false")
        url.searchParams.set("representative", "no-user@example.com")
      }

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()
        let filteredVendors = data.data || []

        if (currentUser && !userIsAdmin) {
          filteredVendors = filteredVendors.filter(
            (vendor: Vendor) =>
              vendor.representative === currentUser.email || vendor.Representative_2 === currentUser.email,
          )
        }

        setVendors(filteredVendors)
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error)
    } finally {
      setLoadingVendors(false)
    }
  }

  const loadCurrentLead = async () => {
    try {
      setIsLoadingLead(true)
      const response = await fetch("/api/telemarketing/leads/current")
      if (response.ok) {
        const lead = await response.json()
        setCurrentLead(lead)
      }
    } catch (error) {
      console.error("Error loading current lead:", error)
    } finally {
      setIsLoadingLead(false)
    }
  }

  const loadScripts = async () => {
    try {
      const response = await fetch("/api/telemarketing/scripts")
      if (response.ok) {
        const scriptsData = await response.json()
        setScripts(scriptsData)
      }
    } catch (error) {
      console.error("Error loading scripts:", error)
    }
  }

  const loadLeadQueue = async () => {
    try {
      const response = await fetch("/api/telemarketing/leads/queue")
      if (response.ok) {
        const queue = await response.json()
        setLeadQueue(queue)
      }
    } catch (error) {
      console.error("Error loading lead queue:", error)
    }
  }

  const loadDispositions = async () => {
    try {
      const response = await fetch("/api/telemarketing/dispositions")
      if (response.ok) {
        const dispositionsData = await response.json()
        setDispositions(dispositionsData)
      }
    } catch (error) {
      console.error("Error loading dispositions:", error)
    }
  }

  const handleVendorSelection = (vendorId: number, checked: boolean) => {
    if (checked) {
      setSelectedVendors((prev) => [...prev, vendorId])
    } else {
      setSelectedVendors((prev) => prev.filter((id) => id !== vendorId))
    }
  }

  const getRecipientList = (type: "sms" | "email", recipientType: string) => {
    if (recipientType === "all") {
      return vendors
        .map((v) => (type === "sms" ? v.phone : v.email))
        .filter(Boolean)
        .join(", ")
    } else if (recipientType === "select") {
      const selected = vendors.filter((v) => selectedVendors.includes(v.id))
      return selected
        .map((v) => (type === "sms" ? v.phone : v.email))
        .filter(Boolean)
        .join(", ")
    }
    return ""
  }

  const handleSignOut = async () => {
    setLoading(true)
    localStorage.removeItem("user")
    await new Promise((resolve) => setTimeout(resolve, 300))
    router.push("/")
  }

  const handleSendGrokMessage = async () => {
    if (!grokMessage.trim() || isGrokLoading) return

    const userMessage = {
      id: grokMessages.length + 1,
      text: grokMessage,
      sender: "user" as const,
    }

    setGrokMessages((prev) => [...prev, userMessage])
    setGrokMessage("")
    setIsGrokLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: grokMessage,
          conversationHistory: grokMessages,
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const grokResponse = {
          id: grokMessages.length + 2,
          text: data.response,
          sender: "grok" as const,
        }
        setGrokMessages((prev) => [...prev, grokResponse])
      } else {
        // Error response
        const errorResponse = {
          id: grokMessages.length + 2,
          text: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
          sender: "grok" as const,
        }
        setGrokMessages((prev) => [...prev, errorResponse])
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorResponse = {
        id: grokMessages.length + 2,
        text: "I'm sorry, I couldn't process your message right now. Please check your connection and try again.",
        sender: "grok" as const,
      }
      setGrokMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsGrokLoading(false)
    }
  }

  const handleSingleSms = async () => {
    // Implementation for handleSingleSms
  }

  const handleMassSms = async () => {
    // Implementation for handleMassSms
  }

  const testSpeakers = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
    gainNode.gain.setValueAtTime(speakerTest.volume, audioContext.currentTime)

    setSpeakerTest((prev) => ({ ...prev, isPlaying: true }))

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 1)

    oscillator.onended = () => {
      setSpeakerTest((prev) => ({ ...prev, isPlaying: false }))
    }
  }

  const handleAudioTest = async () => {
    setIsTestingAudio(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)

      microphone.connect(analyser)
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
        setIsTestingAudio(false)
        setMicrophoneLevel(0)
      }, 3000)
    } catch (error) {
      console.error("[v0] Audio test failed:", error)
      setIsTestingAudio(false)
      setCallStatus("Microphone access denied. Please enable microphone permissions.")
    }
  }

  const startMicTest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      microphone.connect(analyser)
      analyser.fftSize = 256

      setMicTest((prev) => ({ ...prev, isActive: true, isRecording: true }))

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray)
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length
        setMicTest((prev) => ({ ...prev, volume: Math.min(volume / 128, 1) }))

        if (micTest.isActive) {
          requestAnimationFrame(updateVolume)
        }
      }

      updateVolume()

      // Stop after 10 seconds
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop())
        audioContext.close()
        setMicTest({ isActive: false, volume: 0, isRecording: false })
      }, 10000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Error accessing microphone. Please check permissions.")
    }
  }

  const saveDisposition = async (disposition: string, notes: string) => {
    if (!currentLead) return

    try {
      const response = await fetch("/api/telemarketing/dispositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: currentLead.id,
          disposition,
          disposition_notes: notes,
          call_duration: 0, // Will be updated with actual call duration
        }),
      })

      if (response.ok) {
        // Load next lead
        loadCurrentLead()
      }
    } catch (error) {
      console.error("Error saving disposition:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      permission: null, // Available to all users
    },
    {
      name: "Vendors",
      href: "/dashboard/vendors",
      icon: Users,
      permission: Permission.VIEW_VENDORS,
    },
    {
      name: "Claims",
      href: "/dashboard/claims",
      icon: FileText,
      permission: Permission.VIEW_CLAIMS,
    },
    {
      name: "Follow-ups",
      href: "/dashboard/followups",
      icon: Bell,
      permission: Permission.VIEW_FOLLOWUPS,
    },
    {
      name: "Telemarketing",
      href: "/dashboard/telemarketing",
      icon: Phone,
      permission: Permission.VIEW_TELEMARKETING,
    },
    {
      name: "Telemarketing Admin",
      href: "/dashboard/telemarketing/admin",
      icon: Settings,
      permission: Permission.SYSTEM_SETTINGS,
    },
    {
      name: "Admin Dashboard",
      href: "/dashboard/admin/comprehensive",
      icon: Shield,
      permission: Permission.SYSTEM_SETTINGS,
    },
    {
      name: "Admin Settings",
      href: "/dashboard/admin",
      icon: Settings,
      permission: Permission.SYSTEM_SETTINGS,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      permission: null, // Available to all users
    },
  ].filter((item) => !item.permission || hasPermission(user, item.permission))

  const getRoleDisplay = (role: string, isAdmin: boolean) => {
    if (isAdmin && role === "super_admin") return { name: "Super Admin", color: "destructive" as const }
    if (isAdmin) return { name: "Admin", color: "default" as const }

    switch (role) {
      case "manager":
        return { name: "Manager", color: "secondary" as const }
      case "user":
        return { name: "User", color: "outline" as const }
      case "viewer":
        return { name: "Viewer", color: "outline" as const }
      default:
        return { name: role, color: "outline" as const }
    }
  }

  const roleDisplay = getRoleDisplay(user.role, user.is_admin)

  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs = [{ name: "Dashboard", href: "/dashboard" }]

    if (pathSegments.length > 1) {
      const currentPage = pathSegments[1]
      switch (currentPage) {
        case "vendors":
          breadcrumbs.push({ name: "Vendor Management", href: "/dashboard/vendors" })
          break
        case "claims":
          breadcrumbs.push({ name: "Claims Management", href: "/dashboard/claims" })
          break
        case "followups":
          breadcrumbs.push({ name: "Follow Up System", href: "/dashboard/followups" })
          break
        case "settings":
          breadcrumbs.push({ name: "Settings", href: "/dashboard/settings" })
          break
        case "admin":
          if (pathSegments[2] === "comprehensive") {
            breadcrumbs.push({ name: "Admin Dashboard", href: "/dashboard/admin/comprehensive" })
          } else {
            breadcrumbs.push({ name: "Admin Settings", href: "/dashboard/admin" })
          }
          break
        case "telemarketing":
          if (pathSegments[2] === "admin") {
            breadcrumbs.push({ name: "Telemarketing Admin", href: "/dashboard/telemarketing/admin" })
          } else {
            breadcrumbs.push({ name: "Telemarketing", href: "/dashboard/telemarketing" })
          }
          break
      }
    }

    return breadcrumbs.map((crumb) => ({ ...crumb, label: crumb.name }))
  }

  const breadcrumbs = generateBreadcrumbs()

  const quickLinks = [
    {
      name: "Vendor Login",
      url: "https://vendor.globaladjustersfla.com",
      description: "Access vendor portal and management tools",
      icon: Users,
    },
    {
      name: "Pricelist",
      url: "https://pricelist.globaladjustersfla.com",
      description: "View current pricing and service rates",
      icon: FileText,
    },
    {
      name: "Online Claim Evaluator",
      url: "https://claims.globaladjustersfla.com",
      description: "Evaluate and process claims online",
      icon: Shield,
    },
    {
      name: "Main Website for Blogs",
      url: "https://globaladjustersfla.com/wpadmin",
      description: "Manage blog content and website updates",
      icon: Settings,
    },
  ]

  const getAccessLevelDisplay = () => {
    const currentUser =
      permissionsUser || user || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null)
    if (!currentUser) return { text: "No Access", variant: "destructive" as const }

    const userIsAdmin =
      currentUser.is_admin === true || currentUser.role === "admin" || currentUser.role === "super_admin"

    if (userIsAdmin) {
      return { text: "All Vendors Access", variant: "default" as const }
    } else {
      return { text: "Assigned Vendors Only", variant: "secondary" as const }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 shadow-2xl border-b border-slate-600/30">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-white/35 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 shadow-lg shadow-black/10">
              <img
                src="https://imagedelivery.net/evaK9kznBmXiy6yXsaBusQ/758bd470-7d38-4600-99b3-2c3ba24c9a00/public"
                alt="Global Logo"
                className="h-8 w-auto"
              />
            </div>
          </div>

          {/* Communication Tools */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-700/80 hover:text-white px-4 py-2 rounded-lg"
              onClick={() => setIsDialerOpen(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Dialer
            </Button>

            <ManualDialer user={user} isOpen={isDialerOpen} onOpenChange={setIsDialerOpen} />

            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-slate-700/80 hover:text-white px-4 py-2 rounded-lg"
                  onClick={fetchVendors}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Mass Email
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    Email Communication
                    <Badge variant={getAccessLevelDisplay().variant} className="ml-2">
                      {getAccessLevelDisplay().text}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single Email</TabsTrigger>
                    <TabsTrigger value="mass">Mass Email</TabsTrigger>
                  </TabsList>
                  <TabsContent value="single" className="space-y-4">
                    <div className="space-y-4">
                      <Label>Recipient</Label>
                      <RadioGroup
                        value={singleEmailType}
                        onValueChange={(value: "vendor" | "other") => setSingleEmailType(value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vendor" id="single-email-vendor" />
                          <Label htmlFor="single-email-vendor">Select from Vendors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="single-email-other" />
                          <Label htmlFor="single-email-other">Other Email Address</Label>
                        </div>
                      </RadioGroup>

                      {singleEmailType === "vendor" ? (
                        <div className="space-y-2">
                          <Label htmlFor="single-email-vendor-select">Select Vendor</Label>
                          <Select value={selectedSingleEmailVendor} onValueChange={setSelectedSingleEmailVendor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a vendor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingVendors ? (
                                <div className="flex items-center justify-center py-4">
                                  <LoadingSpinner size="sm" />
                                </div>
                              ) : (
                                vendors
                                  .filter((vendor) => vendor.email && vendor.email.trim() !== "")
                                  .map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.email}>
                                      {vendor.name} ({vendor.email}) - {vendor.business_name}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="single-email-manual">Email Address</Label>
                          <Input id="single-email-manual" placeholder="Enter email address" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="single-subject">Subject</Label>
                      <Input id="single-subject" placeholder="Email subject" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="single-message">Message</Label>
                      <Textarea id="single-message" placeholder="Type your message here..." rows={6} />
                    </div>
                    <Button className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                  </TabsContent>
                  <TabsContent value="mass" className="space-y-4">
                    <div className="space-y-4">
                      <Label>Recipients</Label>
                      <RadioGroup
                        value={emailRecipientType}
                        onValueChange={(value: "all" | "select" | "other") => setEmailRecipientType(value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="email-all" />
                          <Label htmlFor="email-all">All Vendors ({vendors.length})</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="select" id="email-select" />
                          <Label htmlFor="email-select">Select Vendors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="email-other" />
                          <Label htmlFor="email-other">Other (Manual Entry)</Label>
                        </div>
                      </RadioGroup>

                      {emailRecipientType === "select" && (
                        <div className="border rounded-lg p-3">
                          <Label className="text-sm font-medium mb-2 block">Select Vendors:</Label>
                          <ScrollArea className="h-32">
                            {loadingVendors ? (
                              <div className="flex items-center justify-center py-4">
                                <LoadingSpinner size="sm" />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {vendors.map((vendor) => (
                                  <div key={vendor.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`vendor-email-${vendor.id}`}
                                      checked={selectedVendors.includes(vendor.id)}
                                      onCheckedChange={(checked) =>
                                        handleVendorSelection(vendor.id, checked as boolean)
                                      }
                                    />
                                    <Label htmlFor={`vendor-email-${vendor.id}`} className="text-sm">
                                      {vendor.name} ({vendor.email}) - {vendor.business_name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                          <p className="text-xs text-gray-500 mt-2">{selectedVendors.length} vendor(s) selected</p>
                        </div>
                      )}

                      {emailRecipientType === "other" && (
                        <Textarea
                          id="mass-recipients"
                          placeholder="Enter email addresses separated by commas or upload CSV"
                          rows={3}
                        />
                      )}

                      {emailRecipientType !== "other" && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Label className="text-sm font-medium">Preview Recipients:</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {getRecipientList("email", emailRecipientType) || "No recipients selected"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mass-subject">Subject</Label>
                      <Input id="mass-subject" placeholder="Email subject" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mass-message">Message</Label>
                      <Textarea id="mass-message" placeholder="Type your message here..." rows={6} />
                    </div>
                    <Button className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Send Mass Email
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-slate-700/80 hover:text-white px-4 py-2 rounded-lg"
                  onClick={fetchVendors}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mass SMS
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    SMS Communication
                    <Badge variant={getAccessLevelDisplay().variant} className="ml-2">
                      {getAccessLevelDisplay().text}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single SMS</TabsTrigger>
                    <TabsTrigger value="mass">Mass SMS</TabsTrigger>
                  </TabsList>
                  <TabsContent value="single" className="space-y-4">
                    <div className="space-y-4">
                      <Label>Recipient</Label>
                      <RadioGroup
                        value={singleSmsType}
                        onValueChange={(value: "vendor" | "other") => setSingleSmsType(value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="vendor" id="single-sms-vendor" />
                          <Label htmlFor="single-sms-vendor">Select from Vendors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="single-sms-other" />
                          <Label htmlFor="single-sms-other">Other Phone Number</Label>
                        </div>
                      </RadioGroup>

                      {singleSmsType === "vendor" ? (
                        <div className="space-y-2">
                          <Label htmlFor="single-sms-vendor-select">Select Vendor</Label>
                          <Select value={selectedSingleSmsVendor} onValueChange={setSelectedSingleSmsVendor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a vendor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingVendors ? (
                                <div className="flex items-center justify-center py-4">
                                  <LoadingSpinner size="sm" />
                                </div>
                              ) : (
                                vendors
                                  .filter((vendor) => vendor.phone && vendor.phone.trim() !== "")
                                  .map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.phone}>
                                      {vendor.name} ({vendor.phone}) - {vendor.business_name}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="single-sms-manual">Phone Number</Label>
                          <Input id="single-sms-manual" placeholder="Enter phone number" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="single-sms">Message</Label>
                      <Textarea id="single-sms" placeholder="Type your SMS message here..." rows={4} maxLength={160} />
                      <p className="text-sm text-gray-500">160 characters max</p>
                    </div>
                    <Button className="w-full" onClick={handleSingleSms} disabled={isSendingSms}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingSms ? "Sending..." : "Send SMS"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="mass" className="space-y-4">
                    <div className="space-y-4">
                      <Label>Recipients</Label>
                      <RadioGroup
                        value={smsRecipientType}
                        onValueChange={(value: "all" | "select" | "other") => setSmsRecipientType(value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="sms-all" />
                          <Label htmlFor="sms-all">All Vendors ({vendors.length})</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="select" id="sms-select" />
                          <Label htmlFor="sms-select">Select Vendors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="sms-other" />
                          <Label htmlFor="sms-other">Other (Manual Entry)</Label>
                        </div>
                      </RadioGroup>

                      {smsRecipientType === "select" && (
                        <div className="border rounded-lg p-3">
                          <Label className="text-sm font-medium mb-2 block">Select Vendors:</Label>
                          <ScrollArea className="h-32">
                            {loadingVendors ? (
                              <div className="flex items-center justify-center py-4">
                                <LoadingSpinner size="sm" />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {vendors.map((vendor) => (
                                  <div key={vendor.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`vendor-sms-${vendor.id}`}
                                      checked={selectedVendors.includes(vendor.id)}
                                      onCheckedChange={(checked) =>
                                        handleVendorSelection(vendor.id, checked as boolean)
                                      }
                                    />
                                    <Label htmlFor={`vendor-sms-${vendor.id}`} className="text-sm">
                                      {vendor.name} ({vendor.phone}) - {vendor.business_name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                          <p className="text-xs text-gray-500 mt-2">{selectedVendors.length} vendor(s) selected</p>
                        </div>
                      )}

                      {smsRecipientType === "other" && (
                        <Textarea
                          id="mass-phones"
                          placeholder="Enter phone numbers separated by commas or upload CSV"
                          rows={3}
                        />
                      )}

                      {smsRecipientType !== "other" && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <Label className="text-sm font-medium">Preview Recipients:</Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {getRecipientList("sms", smsRecipientType) || "No recipients selected"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mass-sms">Message</Label>
                      <Textarea id="mass-sms" placeholder="Type your SMS message here..." rows={4} maxLength={160} />
                      <p className="text-sm text-gray-500">160 characters max</p>
                    </div>
                    <Button className="w-full" onClick={handleMassSms} disabled={isSendingSms}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingSms ? "Sending..." : "Send Mass SMS"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-700/80 hover:text-white px-4 py-2 rounded-lg"
              onClick={() => setIsGrokOpen(!isGrokOpen)}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Bot
            </Button>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-slate-200">{user.email}</div>
            </div>
            <Badge
              variant="secondary"
              className="flex items-center space-x-1 px-3 py-1 bg-slate-700/80 text-white border-slate-600/50"
            >
              <Shield className="h-3 w-3" />
              <span>{roleDisplay.name}</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 shadow-2xl pt-16 border-t border-slate-600/30">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-800 via-blue-800 to-slate-700 opacity-60"></div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
                      isActive
                        ? "bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg"
                        : "text-slate-200 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-slate-300 group-hover:text-white"}`}
                    />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="mb-3 px-4 py-3 bg-slate-800/70 rounded-xl border border-slate-700">
            <div className="text-xs text-slate-300 mb-1">Signed in as</div>
            <div className="text-sm text-white font-medium truncate">{user.name}</div>
            <div className="text-xs text-slate-300 truncate">{user.email}</div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-slate-200 hover:text-white hover:bg-slate-700/50 rounded-xl"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64 pt-16">
        <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center">
                      {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
                      <Link href={crumb.href} className="hover:text-gray-700 transition-colors">
                        {crumb.label}
                      </Link>
                    </div>
                  ))}
                </nav>
              </div>

              {pathname === "/dashboard/telemarketing" && (
                <div className="flex items-center space-x-3 bg-slate-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-white text-sm font-medium">Contact 1 of 25</span>
                    <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="h-6 w-px bg-slate-600"></div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all">
                      <PhoneOff className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all">
                      <Pause className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="h-6 w-px bg-slate-600"></div>

                  <div className="flex items-center space-x-3">
                    <div className="text-white text-sm font-mono">00:00:00</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm">Power</span>
                      <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-600 transition-colors focus:outline-none">
                        <span className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform translate-x-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="p-6">
          {pathname === "/dashboard/telemarketing" ? (
            <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
              <header className="mb-6 p-4 bg-white border border-gray-200 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-600">Live Session Active</span>
                    </div>
                    <div className="text-sm text-gray-500">Agent: {user?.name || "Unknown User"}</div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={async () => {
                        if (!currentLead) return

                        try {
                          const response = await fetch("/api/telemarketing/twilio", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "initiate_call",
                              phoneNumber: currentLead.phone,
                              leadId: currentLead.id,
                              userId: user?.id || 1,
                            }),
                          })

                          if (response.ok) {
                            const data = await response.json()
                            setCurrentCallSid(data.callSid)
                            setIsCallActive(true)
                          }
                        } catch (error) {
                          console.error("Failed to initiate call:", error)
                        }
                      }}
                      disabled={!currentLead || isCallActive}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      {isCallActive ? "Call Active" : "Start Call"}
                    </Button>

                    {isCallActive && (
                      <Button
                        onClick={async () => {
                          try {
                            await fetch("/api/telemarketing/twilio", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "end_call",
                                callSid: currentCallSid,
                              }),
                            })

                            setIsCallActive(false)
                            setCurrentCallSid(null)
                          } catch (error) {
                            console.error("Failed to end call:", error)
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        End Call
                      </Button>
                    )}

                    <Button
                      onClick={async () => {
                        if (isMicTesting) {
                          // Stop testing
                          if (micStream) {
                            micStream.getTracks().forEach((track) => track.stop())
                            setMicStream(null)
                          }
                          setIsMicTesting(false)
                          setMicLevel(0)
                        } else {
                          // Start testing
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                            setMicStream(stream)
                            setIsMicTesting(true)

                            // Create audio context for level monitoring
                            const audioContext = new AudioContext()
                            const analyser = audioContext.createAnalyser()
                            const microphone = audioContext.createMediaStreamSource(stream)
                            const dataArray = new Uint8Array(analyser.frequencyBinCount)

                            microphone.connect(analyser)
                            analyser.fftSize = 256

                            const updateLevel = () => {
                              if (isMicTesting) {
                                analyser.getByteFrequencyData(dataArray)
                                const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                                setMicLevel(Math.min(100, (average / 128) * 100))
                                requestAnimationFrame(updateLevel)
                              }
                            }
                            updateLevel()
                          } catch (error) {
                            console.error("Microphone access denied:", error)
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isMicTesting
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isMicTesting ? "Stop Mic Test" : "Test Microphone"}
                    </Button>

                    {isMicTesting && (
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-100"
                            style={{ width: `${micLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{Math.round(micLevel)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* Main Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* Lead Information - Left Column */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Lead Information</h3>
                    {isLoadingLead && <div className="text-xs text-blue-200 mt-1">Loading lead...</div>}
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Name</label>
                        <input
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                          value={currentLead?.contact_person || ""}
                          onChange={(e) =>
                            setCurrentLead((prev) => (prev ? { ...prev, contact_person: e.target.value } : null))
                          }
                          placeholder="Contact Person"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Company</label>
                        <input
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                          value={currentLead?.company_name || ""}
                          onChange={(e) =>
                            setCurrentLead((prev) => (prev ? { ...prev, company_name: e.target.value } : null))
                          }
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Address</label>
                        <input
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                          value={currentLead?.address || ""}
                          onChange={(e) =>
                            setCurrentLead((prev) => (prev ? { ...prev, address: e.target.value } : null))
                          }
                          placeholder="Address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Email</label>
                          <input
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                            value={currentLead?.email || ""}
                            onChange={(e) =>
                              setCurrentLead((prev) => (prev ? { ...prev, email: e.target.value } : null))
                            }
                            placeholder="Email"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Phone</label>
                          <input
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                            value={currentLead?.phone || ""}
                            onChange={(e) =>
                              setCurrentLead((prev) => (prev ? { ...prev, phone: e.target.value } : null))
                            }
                            placeholder="Phone"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Source</label>
                          <select
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                            value={currentLead?.lead_source || ""}
                            onChange={(e) =>
                              setCurrentLead((prev) => (prev ? { ...prev, lead_source: e.target.value } : null))
                            }
                          >
                            <option value="">Select Source</option>
                            <option value="Google Ads">Google Ads</option>
                            <option value="Referral">Referral</option>
                            <option value="Website">Website</option>
                            <option value="Inbound Call">Inbound Call</option>
                            <option value="Cold Call">Cold Call</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Status</label>
                          <select
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                            value={currentLead?.status || ""}
                            onChange={(e) =>
                              setCurrentLead((prev) => (prev ? { ...prev, status: e.target.value } : null))
                            }
                          >
                            <option value="">Select Status</option>
                            <option value="New">New</option>
                            <option value="Warm">Warm</option>
                            <option value="Hot">Hot</option>
                            <option value="Do Not Call">Do Not Call</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {currentLead?.industry && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-semibold">
                            {currentLead.industry}
                          </span>
                        )}
                        {currentLead?.high_intent && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            High Intent
                          </span>
                        )}
                        {currentLead?.priority && currentLead.priority > 3 && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            Priority
                          </span>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <label className="block text-xs text-gray-600 mb-2">Microphone Test</label>
                        <div className="space-y-2">
                          <button
                            onClick={startMicTest}
                            disabled={micTest.isActive}
                            className="w-full px-3 py-2 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white rounded-xl text-sm font-semibold hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 transition-all shadow-lg disabled:opacity-50"
                          >
                            {micTest.isActive ? "Testing Microphone..." : "Test Microphone"}
                          </button>
                          {micTest.isActive && (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-600">Volume Level:</div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-100"
                                  style={{ width: `${micTest.volume * 100}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500">
                                {micTest.volume > 0.1 ? "✓ Microphone working" : "Speak into microphone..."}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Column - Call Script & Notes */}
                <div className="space-y-4">
                  {/* Call Script */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Scripts</h3>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto max-h-96">
                      {scripts.length > 0 ? (
                        scripts.map((script) => (
                          <div key={script.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-semibold text-gray-900">{script.name}</div>
                              <button className="px-2 py-1 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white rounded text-xs font-semibold hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 transition-all shadow-lg">
                                Use Script
                              </button>
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-3">{script.content}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <div className="text-sm">No scripts available</div>
                          <div className="text-xs mt-1">Scripts will appear here when loaded</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex-1">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Call Notes</h3>
                    </div>
                    <div className="p-4 flex flex-col h-full">
                      <textarea
                        className="flex-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 resize-none min-h-[120px] focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        placeholder="Add notes about this call..."
                      ></textarea>
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all">
                          Timestamp
                        </button>
                        <button className="px-3 py-1 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white rounded-lg text-sm font-semibold hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 transition-all shadow-lg">
                          Save Note
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Upcoming Leads & Dispatch */}
                <div className="space-y-4">
                  {/* Upcoming Leads */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex-1">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Lead Queue</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto max-h-96">
                      {leadQueue.length > 0 ? (
                        leadQueue.map((lead) => (
                          <div key={lead.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {lead.contact_person || lead.company_name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {lead.phone} • {lead.lead_source} • {lead.industry}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCurrentLead(lead)}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-all"
                              >
                                Preview
                              </button>
                              <button
                                onClick={() => setCurrentLead(lead)}
                                className="px-2 py-1 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white rounded text-xs font-semibold hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 transition-all shadow-lg"
                              >
                                Call Now
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <div className="text-sm">No leads in queue</div>
                          <div className="text-xs mt-1">Leads will appear here when available</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dispatch / Disposition */}
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex-1">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                        Dispatch / Disposition
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {[
                          "No Answer",
                          "Busy",
                          "Voicemail",
                          "Not Interested",
                          "Callback",
                          "Appointment Set",
                          "Sale",
                          "Do Not Call",
                        ].map((disposition) => (
                          <button
                            key={disposition}
                            onClick={() => saveDisposition(disposition, "")}
                            className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded-full text-xs hover:bg-blue-50 hover:border-blue-900 hover:text-blue-900 transition-all"
                          >
                            {disposition}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Notes</label>
                        <textarea
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none"
                          rows={3}
                          placeholder="Add notes about this call..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white rounded-xl text-sm font-semibold hover:from-slate-800 hover:via-blue-800 hover:to-slate-700 transition-all shadow-lg">
                          Save & Next Lead
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : pathname === "/dashboard" ? (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Coming Soon Header */}

              {/* Quick Links Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <LinkIcon className="h-6 w-6 text-slate-600" />
                  <h3 className="text-2xl font-semibold text-gray-900">Quick Links</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickLinks.map((link) => (
                    <Card key={link.name} className="group border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                              <link.icon className="h-5 w-5 text-slate-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900">{link.name}</CardTitle>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-gray-600 mb-4">{link.description}</CardDescription>
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900"
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            Visit {link.name}
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="text-center space-y-2">
                  <h4 className="text-lg font-semibold text-slate-900">Stay Updated</h4>
                  <p className="text-slate-700">
                    Our new dashboard will include advanced analytics, automated workflows, and enhanced reporting
                    features.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {isGrokOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 ${
            isGrokMinimized ? "w-80 h-12" : "w-80 h-96"
          }`}
        >
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-medium">Global AI Assistant</span>
                <span className="text-xs text-slate-300">Expert in Public Adjusting & Law</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setIsGrokMinimized(!isGrokMinimized)}
              >
                {isGrokMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setIsGrokOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {!isGrokMinimized && (
            <>
              <div className="flex-1 p-3 h-64 overflow-y-auto space-y-2">
                {grokMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === "user" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isGrokLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    value={grokMessage}
                    onChange={(e) => setGrokMessage(e.target.value)}
                    placeholder="Ask about public adjusting, law, or claims..."
                    onKeyPress={(e) => e.key === "Enter" && !isGrokLoading && handleSendGrokMessage()}
                    className="flex-1"
                    disabled={isGrokLoading}
                  />
                  <Button
                    onClick={handleSendGrokMessage}
                    size="sm"
                    className="bg-slate-700 hover:bg-slate-800"
                    disabled={isGrokLoading || !grokMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
