"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { PhoneCall, Clock, TrendingUp, TrendingDown, Users, Target, Download, Filter } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import type { DateRange } from "react-day-picker"

interface CallRecord {
  id: number
  user_id: number
  user_name: string
  lead_id: number
  lead_company: string
  phone_number: string
  call_sid: string
  status: "completed" | "busy" | "no-answer" | "failed" | "canceled"
  duration: number
  start_time: string
  end_time: string
  recording_url?: string
  notes?: string
  outcome: "interested" | "not_interested" | "callback" | "converted" | "no_contact"
  rating: number
  created_at: string
}

interface CallAnalytics {
  total_calls: number
  successful_calls: number
  failed_calls: number
  average_duration: number
  conversion_rate: number
  total_talk_time: number
  calls_by_hour: Array<{ hour: number; calls: number }>
  calls_by_day: Array<{ date: string; calls: number; conversions: number }>
  calls_by_outcome: Array<{ outcome: string; count: number; percentage: number }>
  calls_by_user: Array<{ user_name: string; total_calls: number; conversions: number; avg_duration: number }>
  top_performing_users: Array<{ user_name: string; conversion_rate: number; total_calls: number }>
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function CallAnalyticsDashboard() {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date(),
  })
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedOutcome, setSelectedOutcome] = useState<string>("all")
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([])
  const { isAdmin, isSuperAdmin } = usePermissions()

  useEffect(() => {
    if (isAdmin() || isSuperAdmin()) {
      fetchAnalytics()
      fetchUsers()
    }
  }, [dateRange, selectedUser, selectedOutcome, isAdmin, isSuperAdmin])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/telemarketing/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (dateRange?.from) {
        params.append("from", dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append("to", dateRange.to.toISOString())
      }
      if (selectedUser !== "all") {
        params.append("user_id", selectedUser)
      }
      if (selectedOutcome !== "all") {
        params.append("outcome", selectedOutcome)
      }

      const [recordsRes, analyticsRes] = await Promise.all([
        fetch(`/api/telemarketing/call-records?${params}`),
        fetch(`/api/telemarketing/analytics?${params}`),
      ])

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        setCallRecords(recordsData.records || [])
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const params = new URLSearchParams()

      if (dateRange?.from) {
        params.append("from", dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        params.append("to", dateRange.to.toISOString())
      }
      if (selectedUser !== "all") {
        params.append("user_id", selectedUser)
      }
      if (selectedOutcome !== "all") {
        params.append("outcome", selectedOutcome)
      }

      const response = await fetch(`/api/telemarketing/export-analytics?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `call-analytics-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Failed to export data")
    }
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "busy":
        return "secondary"
      case "no-answer":
        return "outline"
      case "failed":
        return "destructive"
      case "canceled":
        return "outline"
      default:
        return "outline"
    }
  }

  const getOutcomeBadgeVariant = (outcome: string) => {
    switch (outcome) {
      case "converted":
        return "default"
      case "interested":
        return "secondary"
      case "callback":
        return "outline"
      case "not_interested":
        return "destructive"
      case "no_contact":
        return "outline"
      default:
        return "outline"
    }
  }

  if (!isAdmin() && !isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600">You need administrator privileges to access call analytics.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into telemarketing call performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Outcome</label>
              <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                <SelectTrigger>
                  <SelectValue placeholder="All outcomes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="no_contact">No Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAnalytics} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.total_calls.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{analytics.successful_calls} successful</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.total_calls > 0
                      ? ((analytics.successful_calls / analytics.total_calls) * 100).toFixed(1)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">{analytics.failed_calls} failed calls</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.conversion_rate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Leads converted to sales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(analytics.average_duration)}</div>
                  <p className="text-xs text-muted-foreground">Per call average</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Talk Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(analytics.total_talk_time)}</div>
                  <p className="text-xs text-muted-foreground">Across all calls</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.calls_by_user.length}</div>
                  <p className="text-xs text-muted-foreground">Making calls</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="records">Call Records</TabsTrigger>
              <TabsTrigger value="users">User Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calls by Day */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Calls Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.calls_by_day}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="calls" stroke="#8884d8" name="Total Calls" />
                          <Line type="monotone" dataKey="conversions" stroke="#82ca9d" name="Conversions" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Calls by Hour */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Calls by Hour of Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.calls_by_hour}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="calls" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Call Outcomes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Call Outcomes Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.calls_by_outcome}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ outcome, percentage }) => `${outcome}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analytics.calls_by_outcome.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top Performers */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.top_performing_users.slice(0, 5).map((user, index) => (
                          <div key={user.user_name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{user.user_name}</p>
                                <p className="text-sm text-gray-500">{user.total_calls} calls</p>
                              </div>
                            </div>
                            <Badge variant="default">{user.conversion_rate.toFixed(1)}%</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {analytics && (
                <div className="grid grid-cols-1 gap-6">
                  {/* User Performance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Performance Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Total Calls</TableHead>
                            <TableHead>Conversions</TableHead>
                            <TableHead>Conversion Rate</TableHead>
                            <TableHead>Avg Duration</TableHead>
                            <TableHead>Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.calls_by_user.map((user) => {
                            const conversionRate =
                              user.total_calls > 0 ? (user.conversions / user.total_calls) * 100 : 0
                            return (
                              <TableRow key={user.user_name}>
                                <TableCell className="font-medium">{user.user_name}</TableCell>
                                <TableCell>{user.total_calls}</TableCell>
                                <TableCell>{user.conversions}</TableCell>
                                <TableCell>{conversionRate.toFixed(1)}%</TableCell>
                                <TableCell>{formatDuration(user.avg_duration)}</TableCell>
                                <TableCell>
                                  {conversionRate >= 15 ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      Excellent
                                    </Badge>
                                  ) : conversionRate >= 10 ? (
                                    <Badge variant="secondary">Good</Badge>
                                  ) : conversionRate >= 5 ? (
                                    <Badge variant="outline">Average</Badge>
                                  ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      Needs Improvement
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="records" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Call Records ({callRecords.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callRecords.slice(0, 50).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(record.start_time).toLocaleDateString()}</div>
                              <div className="text-gray-500">{new Date(record.start_time).toLocaleTimeString()}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{record.user_name}</TableCell>
                          <TableCell>{record.lead_company}</TableCell>
                          <TableCell className="font-mono text-sm">{record.phone_number}</TableCell>
                          <TableCell>{formatDuration(record.duration)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(record.status)}>
                              {record.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getOutcomeBadgeVariant(record.outcome)}>
                              {record.outcome.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-sm ${star <= record.rating ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {record.recording_url && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={record.recording_url} target="_blank" rel="noopener noreferrer">
                                    Play
                                  </a>
                                </Button>
                              )}
                              {record.notes && (
                                <Button variant="outline" size="sm" title={record.notes}>
                                  Notes
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Performance Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Call Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.calls_by_user} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="user_name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total_calls" fill="#8884d8" name="Total Calls" />
                          <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* User Conversion Rates */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Conversion Rates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.calls_by_user
                          .sort((a, b) => {
                            const aRate = a.total_calls > 0 ? (a.conversions / a.total_calls) * 100 : 0
                            const bRate = b.total_calls > 0 ? (b.conversions / b.total_calls) * 100 : 0
                            return bRate - aRate
                          })
                          .map((user) => {
                            const conversionRate =
                              user.total_calls > 0 ? (user.conversions / user.total_calls) * 100 : 0
                            return (
                              <div key={user.user_name} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{user.user_name}</span>
                                  <span className="text-sm text-gray-600">
                                    {conversionRate.toFixed(1)}% ({user.conversions}/{user.total_calls})
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(conversionRate, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
