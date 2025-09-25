"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserRole } from "@/lib/permissions"

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserAdded: () => void
}

export function AddUserModal({ open, onOpenChange, onUserAdded }: AddUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: UserRole.USER,
    is_admin: false,
    is_active: true,
    company_tag: "global",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onUserAdded()
        onOpenChange(false)
        setFormData({
          name: "",
          email: "",
          role: UserRole.USER,
          is_admin: false,
          is_active: true,
          company_tag: "global",
          password: "",
        })
      } else {
        const error = await response.json()
        alert(error.message || "Failed to add user")
      }
    } catch (error) {
      alert("An error occurred while adding the user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account with appropriate permissions.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value as UserRole }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.VIEWER}>Viewer</SelectItem>
                <SelectItem value={UserRole.USER}>User</SelectItem>
                <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={UserRole.SUPER_ADMIN}>Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select
              value={formData.company_tag}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, company_tag: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="referral">Referral Experts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_admin"
              checked={formData.is_admin}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_admin: checked }))}
            />
            <Label htmlFor="is_admin">Admin Privileges</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active Account</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
