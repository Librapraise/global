"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MoreHorizontal, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddClaimModal } from "@/components/add-claim-modal"

interface Claim {
  id: number
  claim_number: string
  vendor_id: number
  status: string
  claim_date: string
  homeowner_name: string
  homeowner_phone: string
  homeowner_email: string
  homeowner_address: string
  insurance_company: string
  property_classification: string
  claim_type: string
  cause_of_loss: string
  affected_areas: string
  submitted_date: string
  claim_amount: number
  company: string
  source: string
  date_of_loss: string
  property_type: string
  damage_type: string
  adjuster_name: string
  adjuster_email: string
  adjuster_phone: string
  notes: string
  created_at: string
}

export function ClaimsManagement() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filters, setFilters] = useState({
    claimNumber: "",
    status: "",
    source: "",
  })

  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    try {
      const response = await fetch("/api/claims")
      if (response.ok) {
        const data = await response.json()
        setClaims(Array.isArray(data) ? data : data?.data || [])
      } else {
        console.error("Failed to fetch claims:", response.statusText)
        setClaims([])
      }
    } catch (error) {
      console.error("Error fetching claims:", error)
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const filteredClaims = (Array.isArray(claims) ? claims : []).filter((claim) => {
    return (
      claim.claim_number?.toLowerCase().includes(filters.claimNumber.toLowerCase()) &&
      (filters.status === "" || filters.status === "all" || claim.status === filters.status) &&
      (filters.source === "" || filters.source === "all" || claim.source === filters.source)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "unpaid":
        return "destructive"
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "in progress":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Claim
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Filter by claim number..."
                value={filters.claimNumber}
                onChange={(e) => setFilters((prev) => ({ ...prev, claimNumber: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN PROGRESS">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.source}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading claims...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Claim Number</TableHead>
                    <TableHead className="font-semibold">Vendor</TableHead>
                    <TableHead className="font-semibold">Vendor Company</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Claim Date</TableHead>
                    <TableHead className="font-semibold">Homeowner</TableHead>
                    <TableHead className="font-semibold">Homeowner Phone</TableHead>
                    <TableHead className="font-semibold">Homeowner Email</TableHead>
                    <TableHead className="font-semibold">Homeowner Address</TableHead>
                    <TableHead className="font-semibold">Insurance Company</TableHead>
                    <TableHead className="font-semibold">Property Class</TableHead>
                    <TableHead className="font-semibold">Claim Type</TableHead>
                    <TableHead className="font-semibold">Cause of Loss</TableHead>
                    <TableHead className="font-semibold">Affected Areas</TableHead>
                    <TableHead className="font-semibold">Submitted</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{claim.id}</TableCell>
                      <TableCell className="font-medium text-blue-600">{claim.claim_number}</TableCell>
                      <TableCell className="text-gray-500">—</TableCell>
                      <TableCell className="text-gray-500">—</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(claim.status)} className="text-xs">
                          {claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {claim.claim_date ? (
                          new Date(claim.claim_date).toLocaleDateString()
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{claim.homeowner_name || "—"}</TableCell>
                      <TableCell>
                        {claim.homeowner_phone ? (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{claim.homeowner_phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {claim.homeowner_email ? (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{claim.homeowner_email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {claim.homeowner_address ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{claim.homeowner_address}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>{claim.insurance_company || <span className="text-gray-500">—</span>}</TableCell>
                      <TableCell>{claim.property_classification || <span className="text-gray-500">—</span>}</TableCell>
                      <TableCell>{claim.claim_type || <span className="text-gray-500">—</span>}</TableCell>
                      <TableCell>{claim.cause_of_loss || <span className="text-gray-500">—</span>}</TableCell>
                      <TableCell>{claim.affected_areas || <span className="text-gray-500">—</span>}</TableCell>
                      <TableCell>
                        {claim.submitted_date ? (
                          new Date(claim.submitted_date).toLocaleDateString()
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
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
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
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

      {/* Add Claim Modal */}
      <AddClaimModal open={showAddModal} onOpenChange={setShowAddModal} onClaimAdded={fetchClaims} />
    </div>
  )
}
