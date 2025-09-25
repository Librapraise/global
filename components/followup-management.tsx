"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, Search, Trash2 } from "lucide-react"
import { ScheduleFollowupModal } from "./schedule-followup-modal"
import { FollowupCompletionModal } from "./followup-completion-modal"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"

interface Vendor {
  id: number
  name: string
  phone: string
  email: string
  business_name: string
  location: string
  trade_type: string
  representative: string
  Representative_2: string
}

interface Followup {
  id: number
  vendor_id: number
  vendor_name: string
  vendor_phone: string
  vendor_email: string
  vendor_business_name: string
  vendor_location: string
  vendor_trade_type: string
  follow_up_date: string
  follow_up_time: string
  meeting_type: string
  organizer: string
  address: string
  notes: string
  status: string
  created_by: string
  created_at: string
  updated_at: string
  answered: boolean
  voicemail: boolean
  text_sent: boolean
  email_sent: boolean
  last_call_rating: number
  licensed: boolean
  representative: string
  trade_type: string
  completed_date?: string
  zoom_meeting?: boolean
  in_person_meeting?: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

function EditableSelect({
  value,
  options,
  onSave,
  placeholder = "Select...",
}: {
  value: string
  options: { value: string; label: string }[]
  onSave: (value: string) => void
  placeholder?: string
}) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (newValue: string) => {
    onSave(newValue)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Select value={value} onValueChange={handleSave}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 p-1 rounded group flex items-center gap-2 min-h-8"
      onClick={() => setIsEditing(true)}
    >
      <span className={value ? "" : "text-gray-400"}>
        {options.find((opt) => opt.value === value)?.label || placeholder}
      </span>
    </div>
  )
}

export default function FollowupManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("not_scheduled")
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null)
  const [filters, setFilters] = useState({
    vendorName: "",
    location: "",
    industry: "",
  })
  const [scheduledFilters, setScheduledFilters] = useState({
    vendorName: "",
    location: "",
    industry: "",
  })
  const [completedFilters, setCompletedFilters] = useState({
    vendorName: "",
    location: "",
    industry: "",
  })
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
  const [selectedFollowupId, setSelectedFollowupId] = useState<number | null>(null)
  const [selectedVendorName, setSelectedVendorName] = useState<string>("")

  const { user } = usePermissions()
  const currentUser = user || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null)
  const isAdmin =
    currentUser && (currentUser.is_admin === true || currentUser.role === "admin" || currentUser.role === "super_admin")

  const updateVendorField = async (vendorId: number, field: string, value: any) => {
    try {
      console.log(`[v0] Updating vendor ${vendorId} field ${field} to:`, value)
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        console.log(`[v0] Successfully updated vendor ${vendorId} field ${field}`)
        fetchVendors() // Refresh data
      } else {
        const errorText = await response.text()
        console.error(`[v0] Failed to update vendor field ${field}:`, errorText)
        throw new Error(`Failed to update ${field}`)
      }
    } catch (error) {
      console.error(`[v0] Error updating vendor ${field}:`, error)
      throw error
    }
  }

  const fetchVendors = useCallback(async () => {
    try {
      const url = new URL("/api/vendors", window.location.origin)
      url.searchParams.set("limit", "1000") // Get all vendors, not just 20

      if (currentUser) {
        if (isAdmin) {
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
        const result: PaginatedResponse<Vendor> = await response.json()
        const filteredData = result.data || []

        // The API already handles access control, so we don't need additional filtering here
        setVendors(filteredData)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
    }
  }, [currentUser, isAdmin])

  const fetchFollowups = useCallback(async () => {
    try {
      const url = new URL("/api/followups", window.location.origin)
      url.searchParams.set("limit", "1000") // Get all followups, not just 20

      if (currentUser) {
        if (isAdmin) {
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
        const result: PaginatedResponse<Followup> = await response.json()
        const filteredData = result.data || []

        // The API already handles access control, so we don't need additional filtering here
        setFollowups(filteredData)
      }
    } catch (error) {
      console.error("Error fetching followups:", error)
    }
  }, [currentUser, isAdmin])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchVendors()
      await fetchFollowups()
      setLoading(false)
    }
    loadData()
  }, [currentUser, fetchVendors, fetchFollowups])

  const getScheduleVendors = () => {
    return vendors.filter((vendor) => {
      const matchesName =
        !filters.vendorName ||
        filters.vendorName === "" ||
        vendor.name.toLowerCase().includes(filters.vendorName.toLowerCase())
      const matchesLocation =
        !filters.location ||
        filters.location === "" ||
        filters.location === "all" ||
        vendor.location?.toLowerCase().includes(filters.location.toLowerCase())
      const matchesIndustry =
        !filters.industry ||
        filters.industry === "" ||
        filters.industry === "all" ||
        vendor.trade_type?.toLowerCase().includes(filters.industry.toLowerCase())
      return matchesName && matchesLocation && matchesIndustry
    })
  }

  const handleScheduleFollowup = async (vendorId: number) => {
    try {
      const response = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          follow_up_date: new Date().toISOString().split("T")[0],
          created_by: user?.name || "System",
        }),
      })

      if (!response.ok) throw new Error("Failed to schedule followup")

      await fetchFollowups()
      toast.success("Follow-up scheduled successfully!")
    } catch (error) {
      console.error("Error scheduling followup:", error)
      toast.error("Failed to schedule follow-up")
    }
  }

  const handleFollowupScheduled = () => {
    fetchFollowups()
    fetchVendors()
  }

  const getNotScheduledVendors = () => {
    const vendorsWithPendingFollowups = followups
      .filter((f) => f.status !== "completed" && f.status !== "Deleted")
      .map((f) => f.vendor_id)
    return vendors.filter((vendor) => !vendorsWithPendingFollowups.includes(vendor.id))
  }

  const getPendingFollowups = () => {
    return followups.filter((f) => {
      if (f.status === "completed" || f.status === "Deleted") return false

      const matchesName =
        !scheduledFilters.vendorName ||
        scheduledFilters.vendorName === "" ||
        f.vendor_name?.toLowerCase().includes(scheduledFilters.vendorName.toLowerCase())
      const matchesLocation =
        !scheduledFilters.location ||
        scheduledFilters.location === "" ||
        f.vendor_location?.toLowerCase().includes(scheduledFilters.location.toLowerCase())
      const matchesIndustry =
        !scheduledFilters.industry ||
        scheduledFilters.industry === "" ||
        f.vendor_trade_type?.toLowerCase().includes(scheduledFilters.industry.toLowerCase())

      return matchesName && matchesLocation && matchesIndustry
    })
  }

  const getCompletedFollowups = () => {
    return followups.filter((f) => {
      if (f.status !== "completed" || f.status === "Deleted") return false

      const matchesName =
        !completedFilters.vendorName ||
        completedFilters.vendorName === "" ||
        f.vendor_name?.toLowerCase().includes(completedFilters.vendorName.toLowerCase())
      const matchesLocation =
        !completedFilters.location ||
        completedFilters.location === "" ||
        f.vendor_location?.toLowerCase().includes(completedFilters.location.toLowerCase())
      const matchesIndustry =
        !completedFilters.industry ||
        completedFilters.industry === "" ||
        f.vendor_trade_type?.toLowerCase().includes(completedFilters.industry.toLowerCase())

      return matchesName && matchesLocation && matchesIndustry
    })
  }

  const handleCompleteFollowup = (followupId: number, vendorName: string) => {
    setSelectedFollowupId(followupId)
    setSelectedVendorName(vendorName)
    setIsCompletionModalOpen(true)
  }

  const handleFollowupCompleted = async () => {
    console.log("[v0] Follow-up completed, refreshing data...")
    await fetchFollowups()
    await fetchVendors()
    setSelectedFollowupId(null)
    setSelectedVendorName("")
    console.log("[v0] Data refresh completed")
  }

  const handleDeleteFollowup = async (followupId: number) => {
    if (!confirm("Are you sure you want to delete this follow-up?")) {
      return
    }

    try {
      const response = await fetch(`/api/followups/${followupId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete follow-up")
      }

      await fetchFollowups()
      await fetchVendors()
      toast.success("Follow-up deleted successfully!")
    } catch (error) {
      console.error("Error deleting follow-up:", error)
      toast.error("Failed to delete follow-up")
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {isAdmin ? "All Follow-ups Access" : "Assigned Follow-ups Only"}
          </Badge>
          <span className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{currentUser?.name || currentUser?.email}</span>
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="not_scheduled" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Not Scheduled ({getNotScheduledVendors().length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled ({getPendingFollowups().length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Complete ({getCompletedFollowups().length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="not_scheduled" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vendors..."
                  value={filters.vendorName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, vendorName: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.location}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, location: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="miami">Miami</SelectItem>
                  <SelectItem value="broward">Broward</SelectItem>
                  <SelectItem value="palm beach">Palm Beach</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.industry}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, industry: value === "all" ? "" : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trade Types</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-background shadow-sm">Vendor Name</TableHead>
                  <TableHead className="sticky left-[200px] z-10 bg-background shadow-sm">Company Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Trade Type</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getNotScheduledVendors()
                  .filter((vendor) => {
                    const matchesName =
                      !filters.vendorName ||
                      filters.vendorName === "" ||
                      vendor.name.toLowerCase().includes(filters.vendorName.toLowerCase())
                    const matchesLocation =
                      !filters.location ||
                      filters.location === "" ||
                      vendor.location?.toLowerCase().includes(filters.location.toLowerCase())
                    const matchesIndustry =
                      !filters.industry ||
                      filters.industry === "" ||
                      vendor.trade_type?.toLowerCase().includes(filters.industry.toLowerCase())
                    return matchesName && matchesLocation && matchesIndustry
                  })
                  .map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium sticky left-0 z-10 bg-background shadow-sm min-w-[200px]">
                        {vendor.name}
                      </TableCell>
                      <TableCell className="sticky left-[200px] z-10 bg-background shadow-sm min-w-[200px]">
                        {vendor.business_name || "N/A"}
                      </TableCell>
                      <TableCell>{vendor.phone || "N/A"}</TableCell>
                      <TableCell>
                        <span className="capitalize">{vendor.location || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {vendor.trade_type || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{vendor.representative || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedVendorId(vendor.id)
                            setIsScheduleModalOpen(true)
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {getNotScheduledVendors().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>All vendors have follow-ups scheduled</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vendors..."
                  value={scheduledFilters.vendorName}
                  onChange={(e) => setScheduledFilters((prev) => ({ ...prev, vendorName: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select
                value={scheduledFilters.location}
                onValueChange={(value) =>
                  setScheduledFilters((prev) => ({ ...prev, location: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="miami">Miami</SelectItem>
                  <SelectItem value="broward">Broward</SelectItem>
                  <SelectItem value="palm beach">Palm Beach</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={scheduledFilters.industry}
                onValueChange={(value) =>
                  setScheduledFilters((prev) => ({ ...prev, industry: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trade Types</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-background shadow-sm">Vendor Name</TableHead>
                  <TableHead className="sticky left-[200px] z-10 bg-background shadow-sm">Company Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Trade Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Meeting Type</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>Complete</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getPendingFollowups().map((followup) => {
                  return (
                    <TableRow key={followup.id}>
                      <TableCell className="font-medium sticky left-0 z-10 bg-background shadow-sm min-w-[200px]">
                        {followup.vendor_name || "N/A"}
                      </TableCell>
                      <TableCell className="sticky left-[200px] z-10 bg-background shadow-sm min-w-[200px]">
                        {followup.vendor_business_name || "N/A"}
                      </TableCell>
                      <TableCell>{followup.vendor_phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {followup.vendor_trade_type || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {followup.follow_up_date ? new Date(followup.follow_up_date).toLocaleDateString() : "N/A"}
                          </div>
                          <div className="text-gray-500">{followup.follow_up_time || "No time set"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {followup.meeting_type || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{followup.organizer || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleCompleteFollowup(followup.id, followup.vendor_name)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Complete
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFollowup(followup.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {getPendingFollowups().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No scheduled follow-ups found</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vendors..."
                  value={completedFilters.vendorName}
                  onChange={(e) => setCompletedFilters((prev) => ({ ...prev, vendorName: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select
                value={completedFilters.location}
                onValueChange={(value) =>
                  setCompletedFilters((prev) => ({ ...prev, location: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="miami">Miami</SelectItem>
                  <SelectItem value="broward">Broward</SelectItem>
                  <SelectItem value="palm beach">Palm Beach</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={completedFilters.industry}
                onValueChange={(value) =>
                  setCompletedFilters((prev) => ({ ...prev, industry: value === "all" ? "" : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trade Types</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-background shadow-sm">Vendor Name</TableHead>
                  <TableHead className="sticky left-[200px] z-10 bg-background shadow-sm">Company Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Trade Type</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Answered</TableHead>
                  <TableHead>Voicemail</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Zoom</TableHead>
                  <TableHead>In Person</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCompletedFollowups().map((followup) => {
                  return (
                    <TableRow key={followup.id}>
                      <TableCell className="font-medium sticky left-0 z-10 bg-background shadow-sm min-w-[200px]">
                        {followup.vendor_name || "N/A"}
                      </TableCell>
                      <TableCell className="sticky left-[200px] z-10 bg-background shadow-sm min-w-[200px]">
                        {followup.vendor_business_name || "N/A"}
                      </TableCell>
                      <TableCell>{followup.vendor_phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {followup.vendor_trade_type || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {followup.completed_date
                          ? new Date(followup.completed_date).toLocaleDateString()
                          : followup.updated_at
                            ? new Date(followup.updated_at).toLocaleDateString()
                            : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={followup.answered ? "default" : "secondary"} className="text-xs">
                          {followup.answered ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={followup.voicemail ? "default" : "secondary"} className="text-xs">
                          {followup.voicemail ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={followup.text_sent ? "default" : "secondary"} className="text-xs">
                          {followup.text_sent ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={followup.email_sent ? "default" : "secondary"} className="text-xs">
                          {followup.email_sent ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={followup.zoom_meeting ? "default" : "secondary"} className="text-xs">
                          {followup.zoom_meeting ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={followup.in_person_meeting ? "default" : "secondary"} className="text-xs">
                          {followup.in_person_meeting ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{followup.last_call_rating || "1"}/5</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={followup.notes || "No notes"}>
                          {followup.notes || "No notes"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFollowup(followup.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {getCompletedFollowups().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No completed follow-ups found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ScheduleFollowupModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onFollowupScheduled={handleFollowupScheduled}
        vendors={vendors}
        selectedVendorId={selectedVendorId}
      />

      <FollowupCompletionModal
        open={isCompletionModalOpen}
        onOpenChange={setIsCompletionModalOpen}
        followupId={selectedFollowupId || 0}
        vendorName={selectedVendorName}
        onCompleted={handleFollowupCompleted}
      />
    </div>
  )
}
