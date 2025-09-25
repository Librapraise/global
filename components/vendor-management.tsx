"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DollarSign,
  CreditCard,
  Users,
  Check,
  X,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  FileText,
  Plus,
  Phone,
} from "lucide-react"
import { AddVendorModal } from "./add-vendor-modal"
import { ScheduleFollowupModal } from "./schedule-followup-modal"
import { PowerDialer } from "./power-dialer" // Import PowerDialer component
import { ManualDialer } from "./manual-dialer" // Import ManualDialer component
import { usePermissions } from "@/hooks/use-permissions"

interface Vendor {
  id: number
  name: string
  email: string
  phone: string
  business_name: string
  location: string
  work_area: string
  specialty: string
  licensed: boolean
  representative: string
  Representative_2: string
  trade_type: string
  property_types: string
  created_at: string
  updated_at: string
  last_contact_date: string | null
  last_contact: string | null
  claims_number: string | null
  last_claim_date: string | null
  followups_count: number
  followups_completed: number
  notes_count?: number
  fees_count?: number
  pricing_count?: number
  worked_with_pa_attorney?: boolean
  pa_attorney_type?: string
  is_independent_broker?: boolean
  sells_homeowners_insurance?: boolean
  sells_commercial_insurance?: boolean
  Interested: number
  password: string | null
  notes: string
  interested: boolean
  hourly_rate: number | null
}

interface VendorNote {
  id: number
  note: string
  created_at: string
  created_by: string
}

interface VendorFee {
  id: number
  fee_type: string
  amount: number
  description: string
  has_fee: boolean
}

interface VendorPricing {
  id: number
  service_name: string
  item_name: string
  price: number
  price_range_from: number
  price_range_to: number
  unit: string
  description: string
}

interface PaginatedResponse {
  data: Vendor[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

function EditableTextCell({
  value,
  onSave,
  placeholder = "Click to edit",
  multiline = false,
  type = "text",
}: {
  value: string
  onSave: (value: string) => void
  placeholder?: string
  multiline?: boolean
  type?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")

  useEffect(() => {
    setEditValue(value || "")
  }, [value])

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-32">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-8 text-sm"
            rows={2}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            type={type}
          />
        )}
        <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 p-1 rounded group flex items-center gap-2 min-h-8"
      onClick={() => setIsEditing(true)}
    >
      <span className={value ? "" : "text-gray-400"}>{value || placeholder}</span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function EditableSelectCell({
  value,
  onSave,
  options,
  placeholder = "Click to select",
}: {
  value: string
  onSave: (value: string) => void
  options: string[]
  placeholder?: string
}) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (newValue: string) => {
    onSave(newValue === "none" ? "" : newValue)
    setIsEditing(false)
  }

  const validOptions = options.filter((option) => option && option.trim() !== "")
  const selectValue = value && value.trim() !== "" ? value : "none"

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-32">
        <Select value={selectValue} onValueChange={handleSave}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {validOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 w-8 p-0">
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 p-1 rounded group flex items-center gap-2 min-h-8"
      onClick={() => setIsEditing(true)}
    >
      <span className={value ? "" : "text-gray-400"}>{value || placeholder}</span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function EditableBooleanCell({
  value,
  onSave,
  label,
}: {
  value: boolean
  onSave: (value: boolean) => void
  label?: string
}) {
  const handleToggle = () => {
    onSave(!value)
  }

  return (
    <div className="cursor-pointer hover:bg-gray-50 p-1 rounded group flex items-center gap-2" onClick={handleToggle}>
      <Badge variant={value ? "default" : "secondary"} className="cursor-pointer">
        {value ? "Yes" : "No"}
      </Badge>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function EditableDateCell({
  value,
  onSave,
  placeholder = "Select date",
}: { value: string | null; onSave: (value: string | null) => void; placeholder?: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")

  useEffect(() => {
    setEditValue(value || "")
  }, [value])

  const handleSave = () => {
    onSave(editValue || null)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          autoFocus
        />
        <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
          <Check className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 w-6 p-0 bg-transparent">
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 p-1 rounded group flex items-center gap-1"
      onClick={() => setIsEditing(true)}
    >
      <span className="text-sm">{value ? new Date(value).toLocaleDateString() : placeholder}</span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
    </div>
  )
}

function EditableUserSelectCell({
  value,
  onSave,
  placeholder = "Select representative",
}: {
  value: string
  onSave: (value: string) => void
  placeholder?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = async () => {
    if (users.length > 0) return // Already loaded

    setLoading(true)
    try {
      const response = await fetch("/api/users?limit=1000") // Get all users
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (newValue: string) => {
    const actualValue = newValue === "none" ? "" : newValue
    onSave(actualValue)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setIsEditing(true)
    fetchUsers()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-48">
        <Select value={value || "none"} onValueChange={handleSave}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={loading ? "Loading users..." : "Select user"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No representative</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.email}>
                {user.name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 w-8 p-0">
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 p-1 rounded group flex items-center gap-2 min-h-8"
      onClick={handleEdit}
    >
      <span className={value ? "" : "text-gray-400"}>{value || placeholder}</span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100" />
    </div>
  )
}

function VendorEditForm({
  vendor,
  onSave,
  onCancel,
}: {
  vendor: Vendor
  onSave: (vendorId: number, field: string, value: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    business_name: "",
    location: "",
    trade_type: "",
    work_area: "",
    property_types: "",
    specialty: "",
    notes: "",
  })

  useEffect(() => {
    setFormData({
      name: vendor.name || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      business_name: vendor.business_name || "",
      location: vendor.location || "",
      work_area: vendor.work_area || "",
      specialty: vendor.specialty || "",
      licensed: vendor.licensed,
      representative: vendor.representative || "",
      trade_type: vendor.trade_type || "",
      interested: vendor.interested,
      password: vendor.password || "",
      worked_with_pa_attorney: vendor.worked_with_pa_attorney || false,
      pa_attorney_type: vendor.pa_attorney_type || "",
      is_independent_broker: vendor.is_independent_broker || false,
      sells_homeowners_insurance: vendor.sells_homeowners_insurance || false,
      sells_commercial_insurance: vendor.sells_commercial_insurance || false,
    })
  }, [vendor])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Save all fields
    Object.entries(formData).forEach(([field, value]) => {
      onSave(vendor.id, field, value)
    })
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
        </div>
        <div>
          <Label>Business Name</Label>
          <Input
            value={formData.business_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, business_name: e.target.value }))}
          />
        </div>
        <div>
          <Label>Location</Label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
          >
            <SelectTrigger>
              <SelectValue />
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
        <div>
          <Label>Trade Type</Label>
          <Select
            value={formData.trade_type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, trade_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
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
      </div>

      <div>
        <Label>Work Area</Label>
        <Input
          value={formData.work_area}
          onChange={(e) => setFormData((prev) => ({ ...prev, work_area: e.target.value }))}
        />
      </div>

      <div>
        <Label>Specialty</Label>
        <Textarea
          value={formData.specialty}
          onChange={(e) => setFormData((prev) => ({ ...prev, specialty: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <Label>Representative</Label>
        <Input
          value={formData.representative}
          onChange={(e) => setFormData((prev) => ({ ...prev, representative: e.target.value }))}
        />
      </div>

      <div>
        <Label>Password</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Leave blank to keep current password"
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formData.licensed}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, licensed: !!checked }))}
          />
          <Label>Licensed</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formData.interested}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, interested: !!checked }))}
          />
          <Label>Interested</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formData.worked_with_pa_attorney}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, worked_with_pa_attorney: !!checked }))}
          />
          <Label>Worked with PA/Attorney</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            value={formData.pa_attorney_type}
            onChange={(e) => setFormData((prev) => ({ ...prev, pa_attorney_type: e.target.value }))}
            placeholder="PA/Attorney Type"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formData.is_independent_broker}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_independent_broker: !!checked }))}
          />
          <Label>Independent Broker</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formData.sells_homeowners_insurance}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, sells_homeowners_insurance: !!checked }))}
          />
          <Label>Sells Homeowners Insurance</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={formData.sells_commercial_insurance}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, sells_commercial_insurance: !!checked }))}
          />
          <Label>Sells Commercial Insurance</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}

function EditableFeeCell({
  fee,
  onSave,
  onDelete,
}: {
  fee: VendorFee
  onSave: (feeId: number, field: string, value: any) => void
  onDelete: (feeId: number) => void
}) {
  return (
    <div className="p-2 border rounded-lg space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <EditableTextCell
            value={fee.fee_type}
            onSave={(value) => onSave(fee.id, "fee_type", value)}
            placeholder="Fee type"
          />
          <EditableTextCell
            value={fee.description}
            onSave={(value) => onSave(fee.id, "description", value)}
            placeholder="Description"
            multiline
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <EditableTextCell
              value={`$${fee.amount}`}
              onSave={(value) => onSave(fee.id, "amount", Number.parseFloat(value.replace("$", "")) || 0)}
              placeholder="$0"
            />
            <EditableBooleanCell
              value={fee.has_fee}
              onSave={(value) => onSave(fee.id, "has_fee", value)}
              label="Active"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(fee.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditablePricingCell({
  pricing,
  onSave,
  onDelete,
}: {
  pricing: VendorPricing
  onSave: (pricingId: number, field: string, value: any) => void
  onDelete: (pricingId: number) => void
}) {
  return (
    <div className="p-2 border rounded-lg space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-1">
          <EditableTextCell
            value={pricing.service_name}
            onSave={(value) => onSave(pricing.id, "service_name", value)}
            placeholder="Service name"
          />
          <EditableTextCell
            value={pricing.item_name}
            onSave={(value) => onSave(pricing.id, "item_name", value)}
            placeholder="Item name"
          />
          <EditableTextCell
            value={pricing.description}
            onSave={(value) => onSave(pricing.id, "description", value)}
            placeholder="Description"
            multiline
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <EditableTextCell
                value={`$${pricing.price_range_from}`}
                onSave={(value) =>
                  onSave(pricing.id, "price_range_from", Number.parseFloat(value.replace("$", "")) || 0)
                }
                placeholder="$0"
              />
              <span>-</span>
              <EditableTextCell
                value={`$${pricing.price_range_to}`}
                onSave={(value) => onSave(pricing.id, "price_range_to", Number.parseFloat(value.replace("$", "")) || 0)}
                placeholder="$0"
              />
            </div>
            <EditableTextCell
              value={pricing.unit}
              onSave={(value) => onSave(pricing.id, "unit", value)}
              placeholder="per unit"
            />
            <EditableTextCell
              value={`Base: $${pricing.price}`}
              onSave={(value) => onSave(pricing.id, "price", Number.parseFloat(value.replace(/[^0-9.]/g, "")) || 0)}
              placeholder="Base: $0"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(pricing.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const ExpandableNotesCell = ({ vendor }: { vendor: Vendor }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [notes, setNotes] = useState<VendorNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotes = async () => {
    if (notes.length > 0) return // Already loaded
    setIsLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      })
      if (response.ok) {
        const note = await response.json()
        setNotes([note, ...notes])
        setNewNote("")
      }
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const deleteNote = async (noteId: number) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/notes/${noteId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== noteId))
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const handleToggle = () => {
    if (!isExpanded) {
      fetchNotes()
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={handleToggle} className="text-green-600 hover:text-green-800 p-1">
        <FileText className="h-4 w-4 mr-1" />
        {vendor.notes_count || 0}
        {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
      </Button>

      {isExpanded && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-3 min-w-80">
          <div className="flex gap-2">
            <Input
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNote()}
              className="flex-1"
            />
            <Button onClick={addNote} size="sm" disabled={!newNote.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-2 text-gray-500">Loading notes...</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="bg-white p-2 rounded border text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <p className="flex-1">{note.note}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {note.created_by} • {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {notes.length === 0 && !isLoading && <div className="text-center py-2 text-gray-500">No notes yet</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExpandableFeesCell({ vendor }: { vendor: Vendor }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [fees, setFees] = useState<VendorFee[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFees = async () => {
    if (fees.length > 0) return // Already loaded
    setLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/fees`)
      if (response.ok) {
        const data = await response.json()
        setFees(data)
      }
    } catch (error) {
      console.error("Error fetching fees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isExpanded) {
      fetchFees()
    }
    setIsExpanded(!isExpanded)
  }

  const handleSaveFee = async (feeId: number, field: string, value: any) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/fees/${feeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (response.ok) {
        setFees(fees.map((fee) => (fee.id === feeId ? { ...fee, [field]: value } : fee)))
      }
    } catch (error) {
      console.error("Error updating fee:", error)
    }
  }

  const handleDeleteFee = async (feeId: number) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/fees/${feeId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setFees(fees.filter((fee) => fee.id !== feeId))
      }
    } catch (error) {
      console.error("Error deleting fee:", error)
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={handleToggle} className="text-green-600 hover:text-green-800">
        <DollarSign className="h-4 w-4 mr-1" />
        {vendor.fees_count || 0}
        {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
      </Button>
      {isExpanded && (
        <div className="mt-2 space-y-2 max-w-md">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : fees.length > 0 ? (
            fees.map((fee) => (
              <EditableFeeCell key={fee.id} fee={fee} onSave={handleSaveFee} onDelete={handleDeleteFee} />
            ))
          ) : (
            <div className="text-sm text-gray-500">No fees available</div>
          )}
        </div>
      )}
    </div>
  )
}

function ExpandablePricingCell({ vendor }: { vendor: Vendor }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pricing, setPricing] = useState<VendorPricing[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPricing = async () => {
    if (pricing.length > 0) return // Already loaded
    setLoading(true)
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/pricing`)
      if (response.ok) {
        const data = await response.json()
        setPricing(data)
      }
    } catch (error) {
      console.error("Error fetching pricing:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!isExpanded) {
      fetchPricing()
    }
    setIsExpanded(!isExpanded)
  }

  const handleSavePricing = async (pricingId: number, field: string, value: any) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/pricing/${pricingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (response.ok) {
        setPricing(pricing.map((p) => (p.id === pricingId ? { ...p, [field]: value } : p)))
      }
    } catch (error) {
      console.error("Error updating pricing:", error)
    }
  }

  const handleDeletePricing = async (pricingId: number) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.id}/pricing/${pricingId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setPricing(pricing.filter((p) => p.id !== pricingId))
      }
    } catch (error) {
      console.error("Error deleting pricing:", error)
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={handleToggle} className="text-purple-600 hover:text-purple-800">
        <CreditCard className="h-4 w-4 mr-1" />
        {vendor.pricing_count || 0}
        {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
      </Button>
      {isExpanded && (
        <div className="mt-2 space-y-2 max-w-md">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : pricing.length > 0 ? (
            pricing.map((p) => (
              <EditablePricingCell key={p.id} pricing={p} onSave={handleSavePricing} onDelete={handleDeletePricing} />
            ))
          ) : (
            <div className="text-sm text-gray-500">No pricing available</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [tradeTypeFilter, setTradeTypeFilter] = useState("")
  const [companyTagFilter, setCompanyTagFilter] = useState("")
  const [representativeFilter, setRepresentativeFilter] = useState("")
  const [isPowerDialerOpen, setIsPowerDialerOpen] = useState(false)
  const [isManualDialerOpen, setIsManualDialerOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    vendorId: number | null
    vendorName: string
  }>({
    isOpen: false,
    vendorId: null,
    vendorName: "",
  })

  const { user, isAdmin } = usePermissions()

  useEffect(() => {
    console.log("[v0] VendorManagement - User authentication state:", {
      user: user,
      userEmail: user?.email,
      userRole: user?.role,
      isAdmin: user?.is_admin,
      localStorageUser: localStorage.getItem("user"),
    })
  }, [user])

  const [error, setError] = useState<string | null>(null)
  const [locationOptions, setLocationOptions] = useState([
    { value: "all", label: "All Locations" },
    { value: "miami", label: "Miami" },
    { value: "broward", label: "Broward" },
    { value: "palm beach", label: "Palm Beach" },
    { value: "hollywood", label: "Hollywood" },
    { value: "pembroke pines", label: "Pembroke Pines" },
  ])
  const [tradeTypeOptions, setTradeTypeOptions] = useState([
    { value: "all", label: "All Trade Types" },
    { value: "plumbing", label: "Plumbing" },
    { value: "hvac", label: "HVAC" },
    { value: "roofing", label: "Roofing" },
    { value: "handyman", label: "Handyman" },
    { value: "roofer", label: "Roofer" },
    { value: "plumber", label: "Plumber" },
  ])

  const updateVendorField = async (vendorId: number, field: string, value: any) => {
    try {
      console.log("[v0] Updating vendor field:", { vendorId, field, value })
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        console.log("[v0] Vendor field updated successfully")
        // Update the vendor in the local state
        setVendors((prev) => prev.map((vendor) => (vendor.id === vendorId ? { ...vendor, [field]: value } : vendor)))
      } else {
        const errorText = await response.text()
        console.error("[v0] Failed to update vendor field:", response.status, errorText)
      }
    } catch (error) {
      console.error("Error updating vendor field:", error)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] fetchVendors - Current user state:", {
        user: user,
        userEmail: user?.email,
        userExists: !!user,
        localStorageRaw: localStorage.getItem("user"),
      })

      const url = new URL("/api/vendors", window.location.origin)
      url.searchParams.set("page", currentPage.toString())
      url.searchParams.set("limit", pagination.limit.toString())

      // Apply search filters
      if (searchTerm) url.searchParams.set("search", searchTerm)
      if (locationFilter) url.searchParams.set("location", locationFilter)
      if (tradeTypeFilter) url.searchParams.set("tradeType", tradeTypeFilter)
      if (companyTagFilter) url.searchParams.set("companyTag", companyTagFilter)
      if (representativeFilter) url.searchParams.set("representative", representativeFilter)

      const userIsAdmin = user && (user.is_admin === true || user.role === "admin" || user.role === "super_admin")

      if (user) {
        console.log("[v0] User authentication check:", {
          email: user.email,
          is_admin: user.is_admin,
          role: user.role,
          final_admin_status: userIsAdmin,
        })

        if (userIsAdmin) {
          // Admin users see all vendors - no filtering
          url.searchParams.set("isAdmin", "true")
          console.log("[v0] Admin user - showing all vendors")
        } else {
          // Non-admin users only see vendors where their email matches representative field
          url.searchParams.set("isAdmin", "false")
          url.searchParams.set("representative", user.email)
          console.log("[v0] Non-admin user - filtering by representative email:", user.email)
        }
      } else {
        const storedUserData = localStorage.getItem("user")
        if (storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData)
            console.log("[v0] Found user data in localStorage, but usePermissions hook didn't detect it:", parsedUser)

            // Use the stored user data for filtering
            const storedUserIsAdmin =
              parsedUser.is_admin === true || parsedUser.role === "admin" || parsedUser.role === "super_admin"

            if (storedUserIsAdmin) {
              url.searchParams.set("isAdmin", "true")
              console.log("[v0] Using stored admin user - showing all vendors")
            } else {
              url.searchParams.set("isAdmin", "false")
              url.searchParams.set("representative", parsedUser.email)
              console.log("[v0] Using stored non-admin user - filtering by representative email:", parsedUser.email)
            }
          } catch (error) {
            console.error("[v0] Error parsing stored user data:", error)
            // No user logged in - show no vendors
            url.searchParams.set("isAdmin", "false")
            url.searchParams.set("representative", "no-user@example.com")
            console.log("[v0] No user logged in - showing no vendors")
          }
        } else {
          // No user logged in - show no vendors
          url.searchParams.set("isAdmin", "false")
          url.searchParams.set("representative", "no-user@example.com")
          console.log("[v0] No user logged in - showing no vendors")
        }
      }

      console.log("[v0] Final API URL:", url.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        console.error("Failed to fetch vendors:", response.status, response.statusText)
        setError(`Failed to fetch vendors: ${response.status} ${response.statusText}`)
        return
      }

      if (data.data) {
        let filteredVendors = data.data

        const currentUser = user || (localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null)
        const currentUserIsAdmin =
          currentUser &&
          (currentUser.is_admin === true || currentUser.role === "admin" || currentUser.role === "super_admin")

        if (currentUser && !currentUserIsAdmin) {
          // Double-check filtering on client side for security
          filteredVendors = filteredVendors.filter(
            (vendor) => vendor.representative === currentUser.email || vendor.Representative_2 === currentUser.email,
          )
          console.log(
            "[v0] Client-side filtered vendors for user:",
            currentUser.email,
            "Count:",
            filteredVendors.length,
          )
        }

        setVendors(filteredVendors)
        setPagination(
          data.pagination || { page: 1, limit: 100, total: 0, totalPages: 1, hasNext: false, hasPrev: false },
        )
        console.log("[v0] Vendors loaded:", filteredVendors.length)
        console.log("[v0] Total vendors from API:", data.pagination?.total || 0)
      } else {
        console.warn("[v0] No vendor data received from API")
        setVendors([])
        setPagination({ page: 1, limit: 100, total: 0, totalPages: 1, hasNext: false, hasPrev: false })
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      setError(`Error fetching vendors: ${error}`)
    } finally {
      setLoading(false)
    }
  }, [
    user,
    searchTerm,
    locationFilter,
    tradeTypeFilter,
    companyTagFilter,
    representativeFilter,
    currentPage,
    pagination.limit,
  ])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleSearch = useCallback(async () => {
    setCurrentPage(1)

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        ...(searchTerm && { search: searchTerm }),
        ...(locationFilter && locationFilter !== "all" && { location: locationFilter }),
        ...(tradeTypeFilter && tradeTypeFilter !== "all" && { trade_type: tradeTypeFilter }),
        ...(isAdmin && { isAdmin: "true" }),
      })

      const url = `/api/vendors?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        console.error("Failed to fetch vendors:", response.status, response.statusText)
        setError(`Failed to fetch vendors: ${response.status} ${response.statusText}`)
        return
      }

      if (data.data) {
        setVendors(data.data)
        setPagination(data.pagination)
        console.log("[v0] Vendors loaded:", data.data.length)
        console.log("[v0] Total vendors from API:", data.pagination?.total || 0)
      } else {
        console.warn("[v0] No vendor data received from API")
        setVendors([])
        setPagination({ page: 1, limit: 50, total: 0, totalPages: 1, hasNext: false, hasPrev: false })
      }
    } catch (error) {
      console.error("Error fetching vendors:", error)
      setError(`Error fetching vendors: ${error}`)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, locationFilter, tradeTypeFilter, currentPage, user, isAdmin])

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange()
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, locationFilter, tradeTypeFilter, companyTagFilter, representativeFilter])

  const handleDeleteVendor = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove vendor from local state
        setVendors(vendors.filter((vendor) => vendor.id !== vendorId))
        // Update pagination total
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
        }))
        console.log("[v0] Vendor deleted successfully")
      } else {
        console.error("[v0] Failed to delete vendor:", response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error deleting vendor:", error)
    } finally {
      setDeleteConfirmation({ isOpen: false, vendorId: null, vendorName: "" })
    }
  }

  const openDeleteConfirmation = (vendor: Vendor) => {
    setDeleteConfirmation({
      isOpen: true,
      vendorId: vendor.id,
      vendorName: vendor.name || vendor.business_name || `Vendor ${vendor.id}`,
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading vendors...</div>
  }

  const handlePowerDialerCall = async (contact: any) => {
    try {
      const response = await fetch("/api/telemarketing/twilio/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: contact.phone,
          leadId: contact.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to initiate call")
      }

      console.log("[v0] Call initiated successfully:", result)
    } catch (error) {
      console.error("[v0] Call failed:", error)
    }
  }

  const handleStatusUpdate = (contactId: string, status: string) => {
    // Update vendor call status in the database
    console.log(`[v0] Updating vendor ${contactId} status to ${status}`)
  }

  // Convert vendors to power dialer contacts format
  const powerDialerContacts = vendors.map((vendor) => ({
    id: vendor.id.toString(),
    name: vendor.name,
    phone: vendor.phone,
    company: vendor.business_name,
    status: "pending" as const,
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground">Manage your contractor network and vendor relationships</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPowerDialerOpen(true)}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Phone className="h-4 w-4 mr-2" />
            Power Dialer
          </Button>
          <Button variant="outline" onClick={() => setIsManualDialerOpen(true)}>
            <Phone className="h-4 w-4 mr-2" />
            Manual Dial
          </Button>
          <Button onClick={() => setIsAddVendorModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {isPowerDialerOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Power Dialer - Vendor Outreach</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsPowerDialerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PowerDialer
              contacts={powerDialerContacts}
              onCall={handlePowerDialerCall}
              onStatusUpdate={handleStatusUpdate}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input placeholder="Search vendors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tradeTypeFilter} onValueChange={setTradeTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by trade type" />
              </SelectTrigger>
              <SelectContent>
                {tradeTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vendor Management
              <Badge variant="outline" className="ml-2 text-xs">
                Click any field to edit
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-4">
                {user && (user.is_admin === true || user.role === "admin" || user.role === "super_admin") ? (
                  <Badge variant="default" className="mr-2">
                    Admin View - All Vendors
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="mr-2">
                    Limited View - Your Assigned Vendors Only
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <span>Showing {vendors.length} vendors</span>
                  <span className="text-gray-400">•</span>
                  <span>
                    {(() => {
                      const uniqueReps = new Set()
                      vendors.forEach((vendor) => {
                        if (vendor.representative) uniqueReps.add(vendor.representative)
                        if (vendor.Representative_2) uniqueReps.add(vendor.Representative_2)
                      })
                      return uniqueReps.size
                    })()} representatives
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-30 bg-background shadow-sm">ID</TableHead>
                  <TableHead className="sticky left-[80px] z-20 bg-background shadow-sm">Name</TableHead>
                  <TableHead className="sticky left-[240px] z-10 bg-background shadow-sm">Business Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Work Area</TableHead>
                  <TableHead className="min-w-48">Specialty</TableHead>
                  <TableHead>Licensed</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Rep 2</TableHead>
                  <TableHead>Trade Type</TableHead>
                  <TableHead>Property Types</TableHead>
                  <TableHead>PA/Attorney</TableHead>
                  <TableHead>Independent Broker</TableHead>
                  <TableHead>Homeowners Ins.</TableHead>
                  <TableHead>Commercial Ins.</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Interested</TableHead>
                  <TableHead>Interest Level</TableHead>
                  <TableHead>Claims #</TableHead>
                  <TableHead>Last Claim</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Follow-ups</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="sticky left-0 z-30 bg-background shadow-sm min-w-[80px]">
                      {vendor.id}
                    </TableCell>
                    <TableCell className="sticky left-[80px] z-20 bg-background shadow-sm">
                      <EditableTextCell
                        value={vendor.name}
                        onSave={(value) => updateVendorField(vendor.id, "name", value)}
                        placeholder="Add name"
                      />
                    </TableCell>
                    <TableCell className="sticky left-[240px] z-10 bg-background shadow-sm">
                      <EditableTextCell
                        value={vendor.business_name}
                        onSave={(value) => updateVendorField(vendor.id, "business_name", value)}
                        placeholder="Add business name"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.phone}
                        onSave={(value) => updateVendorField(vendor.id, "phone", value)}
                        placeholder="Add phone"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.email}
                        onSave={(value) => updateVendorField(vendor.id, "email", value)}
                        placeholder="Add email"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableSelectCell
                        value={vendor.location}
                        onSave={(value) => updateVendorField(vendor.id, "location", value)}
                        options={locationOptions.map((o) => o.value)}
                        placeholder="Select location"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.work_area}
                        onSave={(value) => updateVendorField(vendor.id, "work_area", value)}
                        placeholder="Add work area"
                      />
                    </TableCell>
                    <TableCell className="min-w-48 max-w-64">
                      <EditableTextCell
                        value={vendor.specialty}
                        onSave={(value) => updateVendorField(vendor.id, "specialty", value)}
                        placeholder="Add specialty"
                        multiline={true}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableBooleanCell
                        value={vendor.licensed}
                        onSave={(value) => updateVendorField(vendor.id, "licensed", value)}
                        label="Licensed"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableUserSelectCell
                        value={vendor.representative}
                        onSave={(value) => updateVendorField(vendor.id, "representative", value)}
                        placeholder="Add representative"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableUserSelectCell
                        value={vendor.Representative_2}
                        onSave={(value) => updateVendorField(vendor.id, "Representative_2", value)}
                        placeholder="Add rep 2"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableSelectCell
                        value={vendor.trade_type || ""}
                        onSave={(value) => updateVendorField(vendor.id, "trade_type", value)}
                        options={[
                          "hvac",
                          "plumber",
                          "electrician",
                          "roofer",
                          "flooring",
                          "painter",
                          "carpenter",
                          "handyman",
                          "landscaper",
                          "real-estate-agent",
                          "property-manager",
                          "insurance-broker",
                        ]}
                        placeholder="Select trade type"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.property_types || ""}
                        onSave={(value) => updateVendorField(vendor.id, "property_types", value)}
                        placeholder="Add property types"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableBooleanCell
                        value={vendor.worked_with_pa_attorney}
                        onSave={(value) => updateVendorField(vendor.id, "worked_with_pa_attorney", value)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableBooleanCell
                        value={vendor.is_independent_broker}
                        onSave={(value) => updateVendorField(vendor.id, "is_independent_broker", value)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableBooleanCell
                        value={vendor.sells_homeowners_insurance}
                        onSave={(value) => updateVendorField(vendor.id, "sells_homeowners_insurance", value)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableBooleanCell
                        value={vendor.sells_commercial_insurance}
                        onSave={(value) => updateVendorField(vendor.id, "sells_commercial_insurance", value)}
                      />
                    </TableCell>
                    <TableCell>
                      <ExpandableNotesCell vendor={vendor} />
                    </TableCell>
                    <TableCell>
                      <ExpandableFeesCell vendor={vendor} />
                    </TableCell>
                    <TableCell>
                      <ExpandablePricingCell vendor={vendor} />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.password || ""}
                        onSave={(value) => updateVendorField(vendor.id, "password", value)}
                        placeholder="Set password"
                        type="password"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableBooleanCell
                        value={vendor.interested}
                        onSave={(value) => updateVendorField(vendor.id, "interested", value)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.Interested?.toString() || ""}
                        onSave={(value) => updateVendorField(vendor.id, "Interested", Number.parseInt(value) || 0)}
                        placeholder="0-10"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableTextCell
                        value={vendor.claims_number || ""}
                        onSave={(value) => updateVendorField(vendor.id, "claims_number", value)}
                        placeholder="Add claims #"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableDateCell
                        value={vendor.last_claim_date}
                        onSave={(value) => updateVendorField(vendor.id, "last_claim_date", value)}
                        placeholder="Add last claim date"
                      />
                    </TableCell>
                    <TableCell>
                      <EditableDateCell
                        value={vendor.last_contact}
                        onSave={(value) => updateVendorField(vendor.id, "last_contact", value)}
                        placeholder="Add last contact"
                      />
                    </TableCell>
                    <TableCell className="text-center">{vendor.followups_completed || 0}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {vendor.updated_at ? new Date(vendor.updated_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteConfirmation(vendor)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete vendor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} vendors
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Vendor</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteConfirmation.vendorName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmation({ isOpen: false, vendorId: null, vendorName: "" })}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmation.vendorId && handleDeleteVendor(deleteConfirmation.vendorId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <AddVendorModal
        open={isAddVendorModalOpen}
        onOpenChange={setIsAddVendorModalOpen}
        onVendorAdded={() => fetchVendors()}
      />

      <ScheduleFollowupModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        onFollowupScheduled={() => fetchVendors()}
        vendors={vendors}
      />

      <ManualDialer user={user} isOpen={isManualDialerOpen} onOpenChange={setIsManualDialerOpen} />
    </div>
  )
}

export { VendorManagement }