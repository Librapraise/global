"use client"

import { useState } from "react"
import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Vendor {
  id: number
  name: string
  location: string
  trade_type: string
}

interface ScheduleFollowupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFollowupScheduled: () => void
  vendors: Vendor[]
  selectedVendorId?: number | null
}

export function ScheduleFollowupModal({
  open,
  onOpenChange,
  onFollowupScheduled,
  vendors,
  selectedVendorId,
}: ScheduleFollowupModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor_id: selectedVendorId ? selectedVendorId.toString() : "",
    follow_up_date: "",
    follow_up_time: "",
    meeting_type: "Phone Call",
    organizer: "",
    address: "",
    notes: "",
  })

  useEffect(() => {
    if (selectedVendorId) {
      setFormData((prev) => ({ ...prev, vendor_id: selectedVendorId.toString() }))
    }
  }, [selectedVendorId])

  useEffect(() => {
    if (open) {
      const now = new Date()
      const today = now.toISOString().split("T")[0]

      // Set default time to current time + 1 hour
      const defaultTime = new Date(now.getTime() + 60 * 60 * 1000)
      const timeString = defaultTime.toTimeString().slice(0, 5)

      setFormData((prev) => ({
        ...prev,
        follow_up_date: prev.follow_up_date || today,
        follow_up_time: prev.follow_up_time || timeString,
      }))
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.vendor_id) {
        alert("Please select a vendor")
        return
      }

      if (!formData.follow_up_date) {
        alert("Please select a follow-up date")
        return
      }

      if (!formData.organizer.trim()) {
        alert("Please enter an organizer name")
        return
      }

      const response = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_id: Number.parseInt(formData.vendor_id),
          follow_up_date: formData.follow_up_date,
          follow_up_time: formData.follow_up_time || null,
          meeting_type: formData.meeting_type,
          organizer: formData.organizer.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim(),
          status: "scheduled",
          created_by: "Admin",
        }),
      })

      if (response.ok) {
        onFollowupScheduled()
        onOpenChange(false)
        const now = new Date()
        const today = now.toISOString().split("T")[0]
        const defaultTime = new Date(now.getTime() + 60 * 60 * 1000)
        const timeString = defaultTime.toTimeString().slice(0, 5)

        setFormData({
          vendor_id: selectedVendorId ? selectedVendorId.toString() : "",
          follow_up_date: today,
          follow_up_time: timeString,
          meeting_type: "Phone Call",
          organizer: "",
          address: "",
          notes: "",
        })
      } else {
        const error = await response.json()
        console.error("[v0] Failed to schedule follow-up:", error)
        alert(error.message || "Failed to schedule follow-up")
      }
    } catch (error) {
      console.error("[v0] Error scheduling follow-up:", error)
      alert("An error occurred while scheduling the follow-up")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getMinDate = () => {
    return new Date().toISOString().split("T")[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white shadow-xl border-0 rounded-lg p-6">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold text-gray-900">Schedule Follow-up</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-2">
            Schedule a follow-up meeting with a vendor. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="vendor" className="text-sm font-medium text-gray-700">
              Vendor *
            </Label>
            <Select
              value={formData.vendor_id}
              onValueChange={(value) => handleInputChange("vendor_id", value)}
              required
            >
              <SelectTrigger className="h-10 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md">
                <SelectValue placeholder="Select a vendor">
                  {formData.vendor_id && vendors.find((v) => v.id.toString() === formData.vendor_id)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id.toString()}>
                    {vendor.name} - {vendor.trade_type} ({vendor.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => handleInputChange("follow_up_date", e.target.value)}
                className="h-10 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md"
                min={getMinDate()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium text-gray-700">
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.follow_up_time}
                onChange={(e) => handleInputChange("follow_up_time", e.target.value)}
                className="h-10 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting_type" className="text-sm font-medium text-gray-700">
              Meeting Type
            </Label>
            <Select value={formData.meeting_type} onValueChange={(value) => handleInputChange("meeting_type", value)}>
              <SelectTrigger className="h-10 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Phone Call">Phone Call</SelectItem>
                <SelectItem value="In-Person">In-Person</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Video Call">Video Call</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizer" className="text-sm font-medium text-gray-700">
              Organizer *
            </Label>
            <Input
              id="organizer"
              placeholder="Who is organizing this follow-up?"
              value={formData.organizer}
              onChange={(e) => handleInputChange("organizer", e.target.value)}
              className="h-10 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">
              Address
            </Label>
            <Input
              id="address"
              placeholder="Meeting address (if applicable)"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="h-10 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this follow-up..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={4}
              className="bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-md resize-none"
            />
          </div>

          <DialogFooter className="pt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 h-10 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-2 h-10 bg-gray-900 hover:bg-gray-800 text-white focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 rounded-md font-medium"
            >
              {loading ? "Scheduling..." : "Schedule Follow-up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
