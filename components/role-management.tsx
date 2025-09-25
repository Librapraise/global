"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, MoreHorizontal, Edit, Trash2, Shield, Settings, Check } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/hooks/use-permissions"

interface Role {
  id: number
  name: string
  description: string
  is_active: boolean
  user_count: number
  permission_count: number
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
  created_at: string
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { isSuperAdmin } = usePermissions()

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    is_active: true,
  })

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions")
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error("Error fetching permissions:", error)
    }
  }

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      })

      if (response.ok) {
        fetchRoles()
        setShowAddRoleModal(false)
        setRoleForm({ name: "", description: "", is_active: true })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create role")
      }
    } catch (error) {
      console.error("Error creating role:", error)
      alert("An error occurred while creating the role")
    }
  }

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roleForm),
      })

      if (response.ok) {
        fetchRoles()
        setShowEditRoleModal(false)
        setSelectedRole(null)
        setRoleForm({ name: "", description: "", is_active: true })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update role")
      }
    } catch (error) {
      console.error("Error updating role:", error)
      alert("An error occurred while updating the role")
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role?")) return

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchRoles()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete role")
      }
    } catch (error) {
      console.error("Error deleting role:", error)
      alert("An error occurred while deleting the role")
    }
  }

  const handleManagePermissions = async (role: Role) => {
    setSelectedRole(role)

    // Fetch role details with permissions
    try {
      const response = await fetch(`/api/roles/${role.id}`)
      if (response.ok) {
        const roleData = await response.json()
        setSelectedPermissions(roleData.permissions?.map((p: Permission) => p.id) || [])
        setShowPermissionsModal(true)
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error)
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission_ids: selectedPermissions }),
      })

      if (response.ok) {
        fetchRoles()
        setShowPermissionsModal(false)
        setSelectedRole(null)
        setSelectedPermissions([])
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update permissions")
      }
    } catch (error) {
      console.error("Error updating permissions:", error)
      alert("An error occurred while updating permissions")
    }
  }

  const openEditModal = (role: Role) => {
    setSelectedRole(role)
    setRoleForm({
      name: role.name,
      description: role.description,
      is_active: role.is_active,
    })
    setShowEditRoleModal(true)
  }

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = []
      }
      acc[permission.resource].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage system roles and permissions</p>
        </div>
        {isSuperAdmin() && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddRoleModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        )}
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="roles" className="data-[state=active]:bg-white">
            <Shield className="h-4 w-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-white">
            <Settings className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          {/* Role Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
                <p className="text-xs text-gray-500">Total Roles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{roles.filter((r) => r.is_active).length}</div>
                <p className="text-xs text-gray-500">Active Roles</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {roles.reduce((sum, r) => sum + r.user_count, 0)}
                </div>
                <p className="text-xs text-gray-500">Total Assignments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{permissions.length}</div>
                <p className="text-xs text-gray-500">Total Permissions</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </CardContent>
          </Card>

          {/* Roles Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading roles...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Users</TableHead>
                        <TableHead className="font-semibold">Permissions</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Created</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.map((role) => (
                        <TableRow key={role.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <div className="font-medium">{role.name}</div>
                              <div className="text-sm text-gray-500">{role.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {role.user_count} users
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {role.permission_count} permissions
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={role.is_active ? "default" : "secondary"} className="text-xs">
                              {role.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditModal(role)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Role
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleManagePermissions(role)}>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Manage Permissions
                                </DropdownMenuItem>
                                {isSuperAdmin() && role.user_count === 0 && (
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteRole(role.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Role
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <div key={resource} className="space-y-3">
                    <h3 className="font-semibold text-lg capitalize">{resource} Permissions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {resourcePermissions.map((permission) => (
                        <div key={permission.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="font-medium text-sm">{permission.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{permission.description}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {permission.resource}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Modal */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a new role with specific permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={roleForm.name}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={roleForm.description}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={roleForm.is_active}
                onCheckedChange={(checked) => setRoleForm((prev) => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active Role</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddRoleModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={showEditRoleModal} onOpenChange={setShowEditRoleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name *</Label>
              <Input
                id="edit-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={roleForm.is_active}
                onCheckedChange={(checked) => setRoleForm((prev) => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="edit-is_active">Active Role</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditRoleModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Modal */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select permissions for this role. Users with this role will inherit these permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
              <div key={resource} className="space-y-3">
                <h3 className="font-semibold text-lg capitalize flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  {resource} Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {resourcePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions((prev) => [...prev, permission.id])
                          } else {
                            setSelectedPermissions((prev) => prev.filter((id) => id !== permission.id))
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label htmlFor={`permission-${permission.id}`} className="cursor-pointer">
                          <div className="font-medium text-sm">{permission.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{permission.description}</div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowPermissionsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions}>
              <Check className="h-4 w-4 mr-2" />
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
