"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, MoreHorizontal, Edit, Trash2, Shield, Users, Settings } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddUserModal } from "@/components/add-user-modal"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/permissions"

interface User {
  id: number
  name: string
  email: string
  role: string
  is_admin: boolean
  is_active: boolean
  company_tag: string
  last_login: string
  created_at: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    company: "",
    status: "",
  })
  const { user: currentUser, isSuperAdmin } = usePermissions()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating user status:", error)
    }
  }

  const filteredUsers = users.filter((user) => {
    return (
      (user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.role === "" || filters.role === "all" || user.role === filters.role) &&
      (filters.company === "" || filters.company === "all" || user.company_tag === filters.company) &&
      (filters.status === "" ||
        filters.status === "all" ||
        (filters.status === "active" && user.is_active) ||
        (filters.status === "inactive" && !user.is_active))
    )
  })

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

  const roleStats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.is_admin).length,
    managers: users.filter((u) => u.role === "manager").length,
    users: users.filter((u) => u.role === "user").length,
    viewers: users.filter((u) => u.role === "viewer").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        {isSuperAdmin() && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="users" className="data-[state=active]:bg-white">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-white">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white">
            <Settings className="h-4 w-4 mr-2" />
            Security Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{roleStats.total}</div>
                <p className="text-xs text-gray-500">Total Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{roleStats.active}</div>
                <p className="text-xs text-gray-500">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{roleStats.admins}</div>
                <p className="text-xs text-gray-500">Admins</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{roleStats.managers}</div>
                <p className="text-xs text-gray-500">Managers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{roleStats.users}</div>
                <p className="text-xs text-gray-500">Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">{roleStats.viewers}</div>
                <p className="text-xs text-gray-500">Viewers</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                />
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.company}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, company: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="referral">Referral Experts</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading users...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Last Login</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const roleDisplay = getRoleDisplay(user.role, user.is_admin)
                        return (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={roleDisplay.color} className="text-xs">
                                {roleDisplay.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {user.company_tag}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={user.is_active}
                                  onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                                  disabled={!isSuperAdmin() || user.id === currentUser?.id}
                                />
                                <span className="text-sm">{user.is_active ? "Active" : "Inactive"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                  </DropdownMenuItem>
                                  {isSuperAdmin() && user.id !== currentUser?.id && (
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Permission</th>
                      <th className="text-center p-2">Super Admin</th>
                      <th className="text-center p-2">Admin</th>
                      <th className="text-center p-2">Manager</th>
                      <th className="text-center p-2">User</th>
                      <th className="text-center p-2">Viewer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(Permission).map((permission) => (
                      <tr key={permission} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{permission.replace(/_/g, " ").toUpperCase()}</td>
                        <td className="text-center p-2">✅</td>
                        <td className="text-center p-2">
                          {permission !== Permission.SYSTEM_SETTINGS && permission !== Permission.MANAGE_USERS
                            ? "✅"
                            : "❌"}
                        </td>
                        <td className="text-center p-2">
                          {!permission.includes("DELETE") &&
                          permission !== Permission.SYSTEM_SETTINGS &&
                          permission !== Permission.MANAGE_USERS
                            ? "✅"
                            : "❌"}
                        </td>
                        <td className="text-center p-2">
                          {permission.includes("VIEW") || permission.includes("CREATE") ? "✅" : "❌"}
                        </td>
                        <td className="text-center p-2">{permission.includes("VIEW") ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Session Management</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Session Timeout</span>
                      <span className="text-sm text-gray-500">24 hours</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max Concurrent Sessions</span>
                      <span className="text-sm text-gray-500">3</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Password Policy</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Minimum Length</span>
                      <span className="text-sm text-gray-500">8 characters</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require Special Characters</span>
                      <span className="text-sm text-gray-500">Yes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserModal open={showAddModal} onOpenChange={setShowAddModal} onUserAdded={fetchUsers} />
    </div>
  )
}
