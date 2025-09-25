"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Download, Filter, Search, Shield, User, Activity } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"

interface AuditLog {
  id: number
  user_id: number
  action: string
  resource_type: string
  resource_id: number | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user_name: string | null
  user_email: string | null
}

interface AuditLogsPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<AuditLogsPagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    action: "all", // Updated default value
    resource_type: "all", // Updated default value
    user_id: "",
    start_date: "",
    end_date: "",
  })

  const { isSuperAdmin, isAdmin } = usePermissions()

  useEffect(() => {
    if (isSuperAdmin() || isAdmin()) {
      fetchAuditLogs()
    }
  }, [pagination.page, isSuperAdmin, isAdmin])

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== "")),
      })

      const response = await fetch(`/api/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchAuditLogs()
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      action: "all", // Updated default value
      resource_type: "all", // Updated default value
      user_id: "",
      start_date: "",
      end_date: "",
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchAuditLogs()
  }

  const getActionBadgeColor = (action: string) => {
    if (action.includes("create")) return "default"
    if (action.includes("update")) return "secondary"
    if (action.includes("delete")) return "destructive"
    if (action.includes("login")) return "outline"
    return "outline"
  }

  const formatDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) return "No details"
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(", ")
  }

  if (!isSuperAdmin() && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need administrator privileges to view audit logs.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">Track system activities and user actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
                <p className="text-xs text-gray-500">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{new Set(logs.map((log) => log.user_id)).size}</div>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {logs.filter((log) => log.action.includes("login")).length}
                </div>
                <p className="text-xs text-gray-500">Login Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">Today</div>
                <p className="text-xs text-gray-500">Time Range</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange("action", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="user.login">User Login</SelectItem>
                  <SelectItem value="user.create">User Create</SelectItem>
                  <SelectItem value="user.update">User Update</SelectItem>
                  <SelectItem value="user.delete">User Delete</SelectItem>
                  <SelectItem value="role.create">Role Create</SelectItem>
                  <SelectItem value="role.update">Role Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource</label>
              <Select
                value={filters.resource_type}
                onValueChange={(value) => handleFilterChange("resource_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All resources</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="roles">Roles</SelectItem>
                  <SelectItem value="permissions">Permissions</SelectItem>
                  <SelectItem value="vendors">Vendors</SelectItem>
                  <SelectItem value="claims">Claims</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex space-x-2">
                <Button onClick={applyFilters} className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Apply</span>
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading audit logs...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Resource</TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                    <TableHead className="font-semibold">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.user_name || "Unknown"}</div>
                          <div className="text-gray-500">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(log.action)} className="text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_id && <div className="text-gray-500">ID: {log.resource_id}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-600 max-w-xs truncate" title={formatDetails(log.details)}>
                          {formatDetails(log.details)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{log.ip_address || "N/A"}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
