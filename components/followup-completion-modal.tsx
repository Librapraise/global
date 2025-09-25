"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle, XCircle, Phone, Mail, MessageSquare, Video, Users, Send } from "lucide-react"

interface FollowupCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  followupId: number
  vendorName: string
  onCompleted: () => void
}

export function FollowupCompletionModal({
  open,
  onOpenChange,
  followupId,
  vendorName,
  onCompleted,
}: FollowupCompletionModalProps) {
  const [formData, setFormData] = useState({
    answered: false,
    voicemail: false,
    text: false,
    zoom: false,
    in_person: false,
    email: false,
    rating: 1,
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const contactMethods = [
    { key: "answered", label: "Answered Call", icon: Phone },
    { key: "voicemail", label: "Left Voicemail", icon: Phone },
    { key: "text", label: "Sent Text Message", icon: MessageSquare },
    { key: "email", label: "Sent Email", icon: Mail },
    { key: "zoom", label: "Zoom Meeting", icon: Video },
    { key: "in_person", label: "In-Person Meeting", icon: Users },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log("[v0] Starting follow-up completion for ID:", followupId)
    console.log("[v0] Completion form data:", formData)

    try {
      const completionData = {
        answered: formData.answered,
        voicemail: formData.voicemail,
        text: formData.text,
        zoom: formData.zoom,
        in_person: formData.in_person,
        email: formData.email,
        rating: formData.rating,
        notes: formData.notes,
        completed_date: new Date().toISOString(),
      }

      console.log("[v0] Sending completion data to API:", completionData)

      const response = await fetch(`/api/followups/${followupId}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completionData),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] API error response:", errorData)
        throw new Error("Failed to complete follow-up")
      }

      const result = await response.json()
      console.log("[v0] Completion successful:", result)

      onCompleted()
      onOpenChange(false)
      toast.success("Follow-up completed successfully!")

      // Reset form
      setFormData({
        answered: false,
        voicemail: false,
        text: false,
        zoom: false,
        in_person: false,
        email: false,
        rating: 1,
        notes: "",
      })
    } catch (error) {
      console.error("Error completing follow-up:", error)
      toast.error("Failed to complete follow-up")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form data
    setFormData({
      answered: false,
      voicemail: false,
      text: false,
      zoom: false,
      in_person: false,
      email: false,
      rating: 1,
      notes: "",
    })
    onOpenChange(false)
  }

  const handleContactMethodChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value === "true" }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Complete Follow-up
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Complete the follow-up for{" "}
            <Badge variant="secondary" className="font-medium">
              {vendorName}
            </Badge>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold text-foreground">Contact Method Results</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactMethods.map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key} className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Label>
                  <Select
                    value={formData[key as keyof typeof formData] ? "true" : "false"}
                    onValueChange={(value) => handleContactMethodChange(key, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false" className="flex items-center">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>No</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="true" className="flex items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Yes</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="rating" className="text-base font-semibold text-foreground">
              Follow-up Rating
            </Label>
            <Select
              value={formData.rating.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, rating: Number.parseInt(value) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select rating (1-5)" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rating}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`text-sm ${i < rating ? "text-yellow-400" : "text-gray-300"}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold text-foreground">
              Follow-up Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Enter detailed notes about this follow-up interaction..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 px-6">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Completing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Complete Follow-up
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
