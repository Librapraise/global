"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserIcon, UserPlus } from "lucide-react"
import { hasPermission, Permission, type User } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/loading-spinner"

function UserProfileForm({
  user,
  onUpdate,
  isAdmin,
}: { user: User; onUpdate: (id: number, data: any) => void; isAdmin: boolean }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "user",
    is_admin: user.is_admin || false,
    is_active: user.is_active !== false,
    company_tag: user.company_tag || "",
    resetPassword: false,
    newPassword: "",
  })

  const handleSubmit = () => {
    onUpdate(user.id, formData)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Company Tag</Label>
          <Input
            value={formData.company_tag}
            onChange={(e) => setFormData({ ...formData, company_tag: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`admin-${user.id}`}
            checked={formData.is_admin}
            onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
          />
          <Label htmlFor={`admin-${user.id}`}>Admin Privileges</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`active-${user.id}`}
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <Label htmlFor={`active-${user.id}`}>Account Active</Label>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`reset-${user.id}`}
          checked={formData.resetPassword}
          onChange={(e) => setFormData({ ...formData, resetPassword: e.target.checked })}
        />
        <Label htmlFor={`reset-${user.id}`}>Reset Password</Label>
      </div>

      {formData.resetPassword && (
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type="password"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          />
        </div>
      )}

      <Button onClick={handleSubmit}>Update User Profile</Button>
    </div>
  )
}

export function UserSettings() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState("profile")

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
    is_admin: false,
    company_tag: "",
  })

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user",
    is_admin: false,
    is_active: true,
    company_tag: "",
    resetPassword: false,
    newPassword: "",
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      // Load all users if admin
      if (hasPermission(user, Permission.MANAGE_USERS)) {
        fetchUsers()
      }
    }
    setLoading(false)
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleProfileUpdate = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setCurrentUser(updatedUser.user)
        localStorage.setItem("user", JSON.stringify(updatedUser.user))
        setProfileForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
        alert("Profile updated successfully!")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to update profile")
      }
    } catch (error) {
      alert("Failed to update profile")
    }
    setSaving(false)
  }

  const handleCreateUser = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      })

      if (response.ok) {
        await fetchUsers()
        setIsAddUserOpen(false)
        setNewUserForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          role: "user",
          is_admin: false,
          company_tag: "",
        })
        alert("User created successfully!")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to create user")
      }
    } catch (error) {
      alert("Failed to create user")
    }
    setSaving(false)
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers()
        if (selectedUser === `user-${userId}`) {
          setSelectedUser("profile")
        }
        alert("User deleted successfully!")
      } else {
        alert("Failed to delete user")
      }
    } catch (error) {
      alert("Failed to delete user")
    }
  }

  const handleUserProfileUpdate = async (userId: number, formData: any) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchUsers()
        alert("User profile updated successfully!")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to update user profile")
      }
    } catch (error) {
      alert("Failed to update user profile")
    }
    setSaving(false)
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentUser) {
    return <div>Please log in to access settings.</div>
  }

  const isAdmin = hasPermission(currentUser, Permission.MANAGE_USERS)

  const getDisplayName = (value: string) => {
    if (value === "profile") return "My Profile"
    if (value === "add-user") return "Add New User"
    const userId = value.replace("user-", "")
    const user = users.find((u) => u.id.toString() === userId)
    return user ? user.name || user.email : "Unknown User"
  }

  const renderContent = () => {
    if (selectedUser === "profile") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              My Profile
            </CardTitle>
            <CardDescription>Manage your personal information and account settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
            <Button onClick={handleProfileUpdate} disabled={saving}>
              {saving ? <LoadingSpinner size="sm" /> : "Update Profile"}
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (selectedUser === "add-user") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </CardTitle>
            <CardDescription>Create a new user account with appropriate permissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Full Name</Label>
                <Input
                  id="new-name"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">Phone</Label>
                <Input
                  id="new-phone"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Role</Label>
                <Select
                  value={newUserForm.role}
                  onValueChange={(value) => setNewUserForm({ ...newUserForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-company">Company Tag</Label>
                <Input
                  id="new-company"
                  value={newUserForm.company_tag}
                  onChange={(e) => setNewUserForm({ ...newUserForm, company_tag: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="new-admin"
                checked={newUserForm.is_admin}
                onChange={(e) => setNewUserForm({ ...newUserForm, is_admin: e.target.checked })}
              />
              <Label htmlFor="new-admin">Admin Privileges</Label>
            </div>
            <Button onClick={handleCreateUser} disabled={saving} className="mt-4">
              {saving ? <LoadingSpinner size="sm" /> : "Create User"}
            </Button>
          </CardContent>
        </Card>
      )
    }

    // Handle individual user editing
    const userId = selectedUser.replace("user-", "")
    const user = users.find((u) => u.id.toString() === userId)

    if (user) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Edit User: {user.name || user.email}
                </CardTitle>
                <CardDescription>Manage user information, permissions, and account settings.</CardDescription>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteUser(user.id)}
                disabled={user.id === currentUser?.id}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <UserProfileForm user={user} onUpdate={handleUserProfileUpdate} isAdmin={true} />
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Label htmlFor="user-select" className="text-sm font-medium">
          Select User to Manage:
        </Label>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select user..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profile">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                My Profile
              </div>
            </SelectItem>
            {isAdmin && (
              <>
                {users.map((user) => (
                  <SelectItem key={user.id} value={`user-${user.id}`}>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      {user.name || user.email}
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="add-user">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add New User
                  </div>
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {renderContent()}
    </div>
  )
}
