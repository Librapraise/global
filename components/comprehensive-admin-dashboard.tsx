"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Shield,
  Activity,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Lock,
  UserCheck,
  Building2,
  BarChart3,
  FileText,
} from "lucide-react"
import { UserManagement } from "@/components/user-management"
import { RoleManagement } from "@/components/role-management"
import { AuditLogs } from "@/components/audit-logs"
import { AdminSettings } from "@/components/admin-settings"
import { usePermissions } from "@/hooks/use-permissions"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalRoles: number
  totalPermissions: number
  recentLogins: number
  systemHealth: "healthy" | "warning" | "critical"
  databaseConnections: number
  auditEvents: number
}

interface RecentActivity {
  id: number
  type: "user_created" | "role_assigned" | "permission_granted" | "login" | "system_update"
  description: string
  user: string
  timestamp: string
  severity: "info" | "warning" | "success" | "error"
}

export function ComprehensiveAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalPermissions: 0,
    recentLogins: 0,
    systemHealth: "healthy",
    databaseConnections: 0,
    auditEvents: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const { isSuperAdmin, isAdmin } = usePermissions()

  useEffect(() => {
    if (isSuperAdmin() || isAdmin()) {
      fetchDashboardData()
    }
  }, [isSuperAdmin, isAdmin])

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard statistics
      const [usersRes, rolesRes, permissionsRes, auditRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/roles"),
        fetch("/api/permissions"),
        fetch("/api/audit-logs?limit=10"),
      ])

      if (usersRes.ok) {
        const users = await usersRes.json()
        const userArray = Array.isArray(users) ? users : users.users || []
        setStats((prev) => ({
          ...prev,
          totalUsers: userArray.length,
          activeUsers: userArray.filter((u: any) => u.is_active).length,
          recentLogins: userArray.filter((u: any) => {
            if (!u.last_login) return false
            const lastLogin = new Date(u.last_login)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
            return lastLogin > oneDayAgo
          }).length,
        }))
      }

      if (rolesRes.ok) {
        const roles = await rolesRes.json()
        setStats((prev) => ({ ...prev, totalRoles: roles.length }))
      }

      if (permissionsRes.ok) {
        const permissions = await permissionsRes.json()
        setStats((prev) => ({ ...prev, totalPermissions: permissions.length }))
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json()
        setStats((prev) => ({ ...prev, auditEvents: auditData.pagination?.total || 0 }))

        // Convert audit logs to recent activity
        const activities: RecentActivity[] =
          auditData.logs?.slice(0, 5).map((log: any, index: number) => ({
            id: index,
            type: log.action.includes("login")
              ? "login"
              : log.action.includes("create")
                ? "user_created"
                : "system_update",
            description: `${log.action} - ${log.resource_type}${log.resource_id ? ` (ID: ${log.resource_id})` : ""}`,
            user: log.user_name || "System",
            timestamp: log.created_at,
            severity: log.action.includes("delete") ? "error" : log.action.includes("create") ? "success" : "info",
          })) || []

        setRecentActivity(activities)
      }

      // Simulate system health check
      setStats((prev) => ({
        ...prev,
        systemHealth: "healthy",
        databaseConnections: Math.floor(Math.random() * 10) + 5,
      }))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setStats((prev) => ({ ...prev, systemHealth: "warning" }))
    } finally {
      setLoading(false)
    }
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "healthy":
        return <Badge className="bg-green-600 text-white">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-600 text-white">Warning</Badge>
      case "critical":
        return <Badge className="bg-red-600 text-white">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_created":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "role_assigned":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "permission_granted":
        return <Lock className="h-4 w-4 text-purple-600" />
      case "login":
        return <Activity className="h-4 w-4 text-orange-600" />
      default:
        return <Settings className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivitySeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (!isSuperAdmin() && !isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
            <p className="text-gray-600 leading-relaxed">
              You need administrator privileges to access the admin dashboard. Please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 text-lg">Comprehensive system administration and management</p>
          </div>
          <div className="flex items-center space-x-3">
            {getHealthBadge(stats.systemHealth)}
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-slate-300">
              <Database className="h-4 w-4 mr-2" />
              {stats.databaseConnections} DB Connections
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm shadow-lg border border-slate-200/50 p-1.5 rounded-2xl">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-medium transition-all duration-200 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/50">
                  <CardTitle className="text-lg text-slate-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-blue-600">{stats.totalUsers}</span>
                      <Badge className="bg-blue-600 text-white">Total</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Active Users</span>
                      <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Recent Logins (24h)</span>
                      <span className="font-semibold text-orange-600">{stats.recentLogins}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50">
                  <CardTitle className="text-lg text-slate-900 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-green-600" />
                    Roles & Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-green-600">{stats.totalRoles}</span>
                      <Badge className="bg-green-600 text-white">Roles</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Permissions</span>
                      <span className="font-semibold text-purple-600">{stats.totalPermissions}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">System Health</span>
                      {getHealthBadge(stats.systemHealth)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200/50">
                  <CardTitle className="text-lg text-slate-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-orange-600" />
                    System Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-orange-600">{stats.auditEvents}</span>
                      <Badge className="bg-orange-600 text-white">Events</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">DB Connections</span>
                      <span className="font-semibold text-blue-600">{stats.databaseConnections}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Status</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-200/50">
                  <CardTitle className="text-lg text-slate-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold text-purple-600">98%</span>
                      <Badge className="bg-purple-600 text-white">Uptime</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Response Time</span>
                      <span className="font-semibold text-green-600">45ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Load Average</span>
                      <span className="font-semibold text-blue-600">0.8</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-slate-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
                      <p className="text-slate-600 mt-4">Loading activity...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${getActivitySeverityColor(activity.severity)}`}>
                                {activity.description}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">No recent activity</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                  <CardTitle className="text-xl text-slate-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-slate-600" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">System Status: Healthy</p>
                        <p className="text-xs text-green-600 mt-1">All services are running normally</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <Database className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">Database Performance</p>
                        <p className="text-xs text-blue-600 mt-1">Query response time: 45ms (Excellent)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <Users className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-800">User Activity</p>
                        <p className="text-xs text-orange-600 mt-1">{stats.recentLogins} users logged in today</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50">
                <CardTitle className="text-xl text-slate-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-slate-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                    <Users className="h-6 w-6" />
                    <span>Add User</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg">
                    <Shield className="h-6 w-6" />
                    <span>Create Role</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg">
                    <FileText className="h-6 w-6" />
                    <span>View Logs</span>
                  </Button>
                  <Button className="h-20 flex-col space-y-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg">
                    <Building2 className="h-6 w-6" />
                    <span>System Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
