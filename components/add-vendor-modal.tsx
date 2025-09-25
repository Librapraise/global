"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddVendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVendorAdded: () => void
}

export function AddVendorModal({ open, onOpenChange, onVendorAdded }: AddVendorModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    business_name: "",
    location: "",
    work_area: "",
    specialty: "",
    licensed: false,
    representative: "",
    trade_type: "",
    interested: false,
    contact: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onVendorAdded()
        onOpenChange(false)
        setFormData({
          name: "",
          phone: "",
          email: "",
          business_name: "",
          location: "",
          work_area: "",
          specialty: "",
          licensed: false,
          representative: "",
          trade_type: "",
          interested: false,
          contact: "",
          notes: "",
        })
      } else {
        const error = await response.json()
        alert(error.message || "Failed to add vendor")
      }
    } catch (error) {
      alert("An error occurred while adding the vendor")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>Enter the vendor information to add them to your network.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleInputChange("business_name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miami">Miami</SelectItem>
                  <SelectItem value="broward">Broward</SelectItem>
                  <SelectItem value="palm beach">Palm Beach</SelectItem>
                  <SelectItem value="hollywood">Hollywood</SelectItem>
                  <SelectItem value="pembroke pines">Pembroke Pines</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_area">Work Area</Label>
              <Input
                id="work_area"
                value={formData.work_area}
                onChange={(e) => handleInputChange("work_area", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade_type">Trade Type</Label>
              <Select value={formData.trade_type} onValueChange={(value) => handleInputChange("trade_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="handyman">Handyman</SelectItem>
                  <SelectItem value="roofer">Roofer</SelectItem>
                  <SelectItem value="plumber">Plumber</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="representative">Representative</Label>
              <Input
                id="representative"
                value={formData.representative}
                onChange={(e) => handleInputChange("representative", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Textarea
              id="specialty"
              value={formData.specialty}
              onChange={(e) => handleInputChange("specialty", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="licensed"
                checked={formData.licensed}
                onCheckedChange={(checked) => handleInputChange("licensed", checked)}
              />
              <Label htmlFor="licensed">Licensed</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="interested"
                checked={formData.interested}
                onCheckedChange={(checked) => handleInputChange("interested", checked)}
              />
              <Label htmlFor="interested">Interested</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
