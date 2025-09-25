"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface AddClaimModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClaimAdded: () => void
}

interface Vendor {
  id: number
  name: string
  business_name: string
  email: string
  phone: string
}

export function AddClaimModal({ open, onOpenChange, onClaimAdded }: AddClaimModalProps) {
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [formData, setFormData] = useState({
    claim_number: "",
    status: "UNPAID",
    claim_date: "",
    homeowner_name: "",
    homeowner_phone: "",
    homeowner_email: "",
    homeowner_address: "",
    insurance_company: "",
    property_classification: "",
    claim_type: "",
    cause_of_loss: "",
    affected_areas: "",
    date_of_loss: "",
    property_type: "",
    damage_type: "",
    vendor_id: "0", // Changed from adjuster fields to vendor_id
    claim_amount: "",
    company: "",
    source: "",
    notes: "",
  })

  useEffect(() => {
    if (open) {
      fetchVendors()
    }
  }, [open])

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors")
      if (response.ok) {
        const data = await response.json()
        // Handle paginated response
        const vendorList = Array.isArray(data) ? data : data.data || []
        setVendors(vendorList)
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const processedData = {
        ...formData,
        claim_amount: formData.claim_amount ? Number.parseFloat(formData.claim_amount) : null,
        claim_date: formData.claim_date || null,
        date_of_loss: formData.date_of_loss || null,
        vendor_id: formData.vendor_id ? Number.parseInt(formData.vendor_id) : null,
        submitted_date: new Date().toISOString(),
      }

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(processedData),
      })

      if (response.ok) {
        onClaimAdded()
        onOpenChange(false)
        setFormData({
          claim_number: "",
          status: "UNPAID",
          claim_date: "",
          homeowner_name: "",
          homeowner_phone: "",
          homeowner_email: "",
          homeowner_address: "",
          insurance_company: "",
          property_classification: "",
          claim_type: "",
          cause_of_loss: "",
          affected_areas: "",
          date_of_loss: "",
          property_type: "",
          damage_type: "",
          vendor_id: "0", // Reset vendor_id instead of adjuster fields
          claim_amount: "",
          company: "",
          source: "",
          notes: "",
        })
      } else {
        const error = await response.json()
        alert(error.message || "Failed to add claim")
      }
    } catch (error) {
      alert("An error occurred while adding the claim")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Claim</DialogTitle>
          <DialogDescription>Enter the claim information to add it to your system.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="claim_number">Claim Number *</Label>
                <Input
                  id="claim_number"
                  value={formData.claim_number}
                  onChange={(e) => handleInputChange("claim_number", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN PROGRESS">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_date">Claim Date</Label>
                <Input
                  id="claim_date"
                  type="date"
                  value={formData.claim_date}
                  onChange={(e) => handleInputChange("claim_date", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Homeowner Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Homeowner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeowner_name">Homeowner Name</Label>
                <Input
                  id="homeowner_name"
                  value={formData.homeowner_name}
                  onChange={(e) => handleInputChange("homeowner_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeowner_phone">Homeowner Phone</Label>
                <Input
                  id="homeowner_phone"
                  value={formData.homeowner_phone}
                  onChange={(e) => handleInputChange("homeowner_phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeowner_email">Homeowner Email</Label>
                <Input
                  id="homeowner_email"
                  type="email"
                  value={formData.homeowner_email}
                  onChange={(e) => handleInputChange("homeowner_email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeowner_address">Homeowner Address</Label>
                <Input
                  id="homeowner_address"
                  value={formData.homeowner_address}
                  onChange={(e) => handleInputChange("homeowner_address", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Property & Claim Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Property & Claim Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance_company">Insurance Company</Label>
                <Input
                  id="insurance_company"
                  value={formData.insurance_company}
                  onChange={(e) => handleInputChange("insurance_company", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_classification">Property Classification</Label>
                <Input
                  id="property_classification"
                  value={formData.property_classification}
                  onChange={(e) => handleInputChange("property_classification", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_type">Claim Type</Label>
                <Input
                  id="claim_type"
                  value={formData.claim_type}
                  onChange={(e) => handleInputChange("claim_type", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cause_of_loss">Cause of Loss</Label>
                <Input
                  id="cause_of_loss"
                  value={formData.cause_of_loss}
                  onChange={(e) => handleInputChange("cause_of_loss", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_loss">Date of Loss</Label>
                <Input
                  id="date_of_loss"
                  type="date"
                  value={formData.date_of_loss}
                  onChange={(e) => handleInputChange("date_of_loss", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_amount">Claim Amount</Label>
                <Input
                  id="claim_amount"
                  type="number"
                  step="0.01"
                  value={formData.claim_amount}
                  onChange={(e) => handleInputChange("claim_amount", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affected_areas">Affected Areas</Label>
              <Textarea
                id="affected_areas"
                value={formData.affected_areas}
                onChange={(e) => handleInputChange("affected_areas", e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Assign to Vendor (Optional)</Label>
                <Select value={formData.vendor_id} onValueChange={(value) => handleInputChange("vendor_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor or leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No Vendor (Unassigned)</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name} - {vendor.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
