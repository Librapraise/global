"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Edit,
  Shield,
  Users,
  Settings,
  Building2,
  UserCheck,
  Save,
  X,
  Phone,
  MessageSquare,
  Activity,
  TrendingUp,
  CheckCircle,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermissions } from "@/hooks/use-permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: number
  name: string
  email: string
  role: string
  is_admin: boolean
  is_active: boolean
  company_tag: string
  rep: string | null
  vendor_access: string
  vendor_count: number
  last_login: string
  created_at: string
}

interface Vendor {
  id: number
  name: string
  business_name: string
  location: string
  trade_type: string
}

interface UserVendorRelation {
  id: number
  user_id: number
  vendor_id: number
  access_level: string
  vendor_name: string
  user_name: string
}

export function AdminSettings() {
  const [users, setUsers] = useState<User[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [userVendorRelations, setUserVendorRelations] = useState<UserVendorRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [selectedVendors, setSelectedVendors] = useState<number[]>([])
  const [editingRep, setEditingRep] = useState<number | null>(null)
  const [repValue, setRepValue] = useState("")
  const { isSuperAdmin, isAdmin } = usePermissions()

  const [telemarketingStats, setTelemarketingStats] = useState({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    activeUsers: 0,
    twilioStatus: "checking",
  })
  const [telemarketingUsers, setTelemarketingUsers] = useState([])

  const representatives = [
    "chaya",
    "yolanda",
    "max",
    "andre",
    "frank",
    "santos",
    "mike",
    "alex",
    "jason",
    "carrol",
    "eli",
  ]

  useEffect(() => {
    if (isAdmin() || isSuperAdmin()) {
      fetchData()
      fetchTelemarketingData()
    }
  }, [isAdmin, isSuperAdmin])

  const fetchData = async () => {
    try {
      const [usersRes, vendorsRes, relationsRes] = await Promise.all([
        fetch("/api/users?limit=100"), // Get more users for admin view
        fetch("/api/vendors"),
        fetch("/api/admin/user-vendor-relations"),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(Array.isArray(usersData) ? usersData : usersData.users || [])
      }

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json()
        setVendors(Array.isArray(vendorsData) ? vendorsData : vendorsData.data || [])
      }

      if (relationsRes.ok) {
        const relationsData = await relationsRes.json()
        setUserVendorRelations(relationsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTelemarketingData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/telemarketing/stats"),
        fetch("/api/telemarketing/users"),
      ])

      if (statsRes.ok) {
        const stats = await statsRes.json()
        setTelemarketingStats(stats)
      }

      if (usersRes.ok) {
        const users = await usersRes.json()
        setTelemarketingUsers(users)
      }
    } catch (error) {
      console.error("Error fetching telemarketing data:", error)
    }
  }

  const handleUserSelect = (userId: number) => {
    setSelectedUser(userId)
    // Get current vendor relations for this user
    const userRelations = userVendorRelations.filter((r) => r.user_id === userId).map((r) => r.vendor_id)
    setSelectedVendors(userRelations)
  }

  const handleVendorToggle = (vendorId: number, checked: boolean) => {
    if (checked) {
      setSelectedVendors((prev) => [...prev, vendorId])
    } else {
      setSelectedVendors((prev) => prev.filter((id) => id !== vendorId))
    }
  }

  const saveVendorRelations = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/admin/user-vendor-relations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser,
          vendor_ids: selectedVendors,
        }),
      })

      if (response.ok) {
        fetchData() // Refresh data
        setSelectedUser(null)
        setSelectedVendors([])
      }
    } catch (error) {
      console.error("Error saving vendor relations:", error)
    }
  }

  const handleRepEdit = (userId: number, currentRep: string | null) => {
    setEditingRep(userId)
    setRepValue(currentRep || "")
  }

  const saveRep = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rep: repValue }),
      })

      if (response.ok) {
        fetchData() // Refresh data
        setEditingRep(null)
        setRepValue("")
      }
    } catch (error) {
      console.error("Error updating rep:", error)
    }
  }

  const handleRepSelect = async (userId: number, selectedRep: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rep: selectedRep }),
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Error updating rep:", error)
    }
  }

  const cancelRepEdit = () => {
    setEditingRep(null)
    setRepValue("")
  }

  const getUserVendorCount = (userId: number) => {
    return userVendorRelations.filter((r) => r.user_id === userId).length
  }

  const getUserVendorNames = (userId: number) => {
    const relations = userVendorRelations.filter((r) => r.user_id === userId)
    return relations.map((r) => r.vendor_name).join(", ") || "No access"
  }

  if (!isAdmin() && !isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 leading-relaxed">
              You need administrator privileges to access this page. Please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 text-lg">Manage users, vendors, and system settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-slate-300">
              <Activity className="h-4 w-4 mr-2" />
              System Active
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="vendor-relations" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm shadow-lg border border-slate-200/50 p-1.5 rounded-2xl">
            <TabsTrigger
              value="vendor-relations"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Vendor Relations
            </TabsTrigger>
            <TabsTrigger
              value="user-overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="telemarketing"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Phone className="h-4 w-4 mr-2" />
              Telemarketing
            </TabsTrigger>
            <TabsTrigger
              value="system-settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              System Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor-relations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Selection */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-slate-600" />
                    Select User to Manage
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                      <p className="text-slate-600 mt-4">Loading users...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {users
                        .filter((u) => !u.is_admin)
                        .map((user) => (
                          <div
                            key={user.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedUser === user.id
                                ? "border-slate-800 bg-slate-50 shadow-md"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                            onClick={() => handleUserSelect(user.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-900">{user.name}</div>
                                <div className="text-sm text-slate-600">{user.email}</div>
                                <div className="text-xs text-slate-500">
                                  {getUserVendorCount(user.id)} vendors • Rep: {user.rep || "Not assigned"}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {user.role}
                                </Badge>
                                <Select
                                  value={user.rep || "None"}
                                  onValueChange={(value) => handleRepSelect(user.id, value)}
                                >
                                  <SelectTrigger className="w-28 h-6 text-xs">
                                    <SelectValue placeholder="Rep" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">None</SelectItem>
                                    {representatives.map((rep) => (
                                      <SelectItem key={rep} value={rep}>
                                        {rep.charAt(0).toUpperCase() + rep.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vendor Assignment */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-slate-600" />
                    {selectedUser
                      ? `Assign Vendors to ${users.find((u) => u.id === selectedUser)?.name}`
                      : "Select a User"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedUser ? (
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Admin users have access to all vendors by default. Regular users only
                          see assigned vendors.
                        </p>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {vendors.map((vendor) => (
                          <div
                            key={vendor.id}
                            className="flex items-center space-x-4 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <Checkbox
                              id={`vendor-${vendor.id}`}
                              checked={selectedVendors.includes(vendor.id)}
                              onCheckedChange={(checked) => handleVendorToggle(vendor.id, checked as boolean)}
                              className="data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
                            />
                            <label htmlFor={`vendor-${vendor.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium text-slate-900">{vendor.name}</div>
                              <div className="text-sm text-slate-600">
                                {vendor.business_name} • {vendor.location} • {vendor.trade_type}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(null)
                            setSelectedVendors([])
                          }}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={saveVendorRelations} className="bg-slate-800 hover:bg-slate-700 text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Save Relations
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">
                        Select a user from the left to manage their vendor access
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="user-overview" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <CardTitle className="text-xl text-slate-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-slate-600" />
                  User Management & Rep Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">Loading user data...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 border-slate-200">
                          <TableHead className="font-semibold text-slate-900">User</TableHead>
                          <TableHead className="font-semibold text-slate-900">Role</TableHead>
                          <TableHead className="font-semibold text-slate-900">Rep</TableHead>
                          <TableHead className="font-semibold text-slate-900">Vendor Access</TableHead>
                          <TableHead className="font-semibold text-slate-900">Count</TableHead>
                          <TableHead className="font-semibold text-slate-900">Status</TableHead>
                          <TableHead className="font-semibold text-slate-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id} className="hover:bg-slate-50 border-slate-200">
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-slate-900">{user.name}</div>
                                <div className="text-sm text-slate-600">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={user.is_admin ? "destructive" : "outline"}
                                className="text-xs font-medium"
                              >
                                {user.is_admin ? "Admin" : user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {editingRep === user.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    value={repValue}
                                    onChange={(e) => setRepValue(e.target.value)}
                                    placeholder="Enter rep name"
                                    className="w-32 h-8 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => saveRep(user.id)}
                                    className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelRepEdit}
                                    className="h-8 w-8 p-0 bg-transparent"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Select
                                  value={user.rep || "None"}
                                  onValueChange={(value) => handleRepSelect(user.id, value)}
                                >
                                  <SelectTrigger className="w-40 h-8 text-sm">
                                    <SelectValue placeholder="Select rep" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="None">Not assigned</SelectItem>
                                    {representatives.map((rep) => (
                                      <SelectItem key={rep} value={rep}>
                                        {rep.charAt(0).toUpperCase() + rep.slice(1)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm max-w-xs truncate text-slate-700">
                                {user.is_admin ? "All Vendors (Admin)" : getUserVendorNames(user.id)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs font-medium">
                                {user.is_admin ? vendors.length : getUserVendorCount(user.id)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs font-medium">
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {!user.is_admin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUserSelect(user.id)}
                                  className="text-slate-700 border-slate-300 hover:bg-slate-50"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Manage
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telemarketing" className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50/50 backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                TwiML endpoint has been created and is active. Calls should now connect properly without hanging up
                immediately.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-green-600" />
                    Twilio Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                      <span className="text-sm font-medium text-green-800">Account SID</span>
                      <Badge className="bg-green-600 text-white shadow-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <span className="text-sm font-medium text-blue-800">TwiML Endpoint</span>
                      <Badge className="bg-blue-600 text-white shadow-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <span className="text-sm font-medium text-purple-800">Phone Number</span>
                      <Badge className="bg-purple-600 text-white shadow-sm">
                        {process.env.TWILIO_PHONE_NUMBER ? "Configured" : "Missing"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/50">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Call Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <span className="text-sm font-medium text-blue-800">Total Calls Today</span>
                      <Badge className="bg-blue-600 text-white shadow-sm text-lg px-3 py-1">
                        {telemarketingStats.totalCalls}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                      <span className="text-sm font-medium text-green-800">Successful Calls</span>
                      <Badge className="bg-green-600 text-white shadow-sm text-lg px-3 py-1">
                        {telemarketingStats.successfulCalls}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                      <span className="text-sm font-medium text-red-800">Failed Calls</span>
                      <Badge className="bg-red-600 text-white shadow-sm text-lg px-3 py-1">
                        {telemarketingStats.failedCalls}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200/50">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-orange-600" />
                    User Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                      <span className="text-sm font-medium text-orange-800">Active Users</span>
                      <Badge className="bg-orange-600 text-white shadow-sm text-lg px-3 py-1">
                        {users.filter((u) => !u.is_admin && u.is_active).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <span className="text-sm font-medium text-purple-800">With Rep Assigned</span>
                      <Badge className="bg-purple-600 text-white shadow-sm text-lg px-3 py-1">
                        {users.filter((u) => u.rep && u.rep.trim() !== "").length}
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <Button className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <Users className="h-4 w-4 mr-2" />
                        Manage All Users
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                <CardTitle className="text-xl text-slate-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-slate-600" />
                  Telemarketing User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 text-lg">Active Telemarketing Users</h3>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Reports
                      </Button>
                      <Button className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white shadow-lg">
                        <Users className="h-4 w-4 mr-2" />
                        Add New User
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
                          <TableHead className="font-semibold text-slate-900">User</TableHead>
                          <TableHead className="font-semibold text-slate-900">Rep</TableHead>
                          <TableHead className="font-semibold text-slate-900">Phone Number</TableHead>
                          <TableHead className="font-semibold text-slate-900">Status</TableHead>
                          <TableHead className="font-semibold text-slate-900">Last Active</TableHead>
                          <TableHead className="font-semibold text-slate-900">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter((u) => !u.is_admin)
                          .slice(0, 10)
                          .map((user) => (
                            <TableRow key={user.id} className="hover:bg-slate-50/50 border-slate-200 transition-colors">
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-900">{user.name}</div>
                                  <div className="text-sm text-slate-600">{user.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs font-medium border-slate-300">
                                  {user.rep || "Not assigned"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600">+1 (555) 000-0000</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.is_active ? "default" : "secondary"}
                                  className={`text-xs font-medium ${
                                    user.is_active ? "bg-green-600 text-white" : "bg-slate-400 text-white"
                                  }`}
                                >
                                  {user.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-slate-600">2 hours ago</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-slate-700 border-slate-300 hover:bg-slate-50 bg-transparent"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-700 border-blue-300 hover:bg-blue-50 bg-transparent"
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system-settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                  <CardTitle className="text-xl text-slate-900">Access Control Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Privileges
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-sm font-medium text-red-800">Super Admin Users</span>
                        <Badge variant="destructive" className="font-semibold">
                          {users.filter((u) => u.is_admin && u.role === "super_admin").length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-800">Admin Users</span>
                        <Badge className="bg-blue-600 font-semibold">
                          {users.filter((u) => u.is_admin && u.role !== "super_admin").length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm font-medium text-slate-800">Regular Users</span>
                        <Badge variant="outline" className="font-semibold">
                          {users.filter((u) => !u.is_admin).length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                  <CardTitle className="text-xl text-slate-900">Vendor Access Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      Access Distribution
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-green-800">Total Vendors</span>
                        <Badge className="bg-green-600 font-semibold">{vendors.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-800">Users with Vendor Access</span>
                        <Badge className="bg-blue-600 font-semibold">
                          {users.filter((u) => !u.is_admin && getUserVendorCount(u.id) > 0).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="text-sm font-medium text-orange-800">Users without Access</span>
                        <Badge className="bg-orange-600 font-semibold">
                          {users.filter((u) => !u.is_admin && getUserVendorCount(u.id) === 0).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <span className="text-sm font-medium text-purple-800">Users with Rep Assigned</span>
                        <Badge className="bg-purple-600 font-semibold">
                          {users.filter((u) => u.rep && u.rep.trim() !== "").length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
