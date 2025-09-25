"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowUpRight,
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/permissions"
import { LoadingCard } from "@/components/loading-spinner"

export function DashboardOverview() {
  const { checkPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStats({
        vendors: { total_vendors: 1234, interested_vendors: 892, licensed_vendors: 1156 },
        claims: { total_claims: 89, open_claims: 34, closed_claims: 55, total_claim_amount: 2450000 },
        followups: { total_followups: 156, scheduled_followups: 24, completed_followups: 132 },
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const statsCards = [
    {
      title: "Total Vendors",
      value: stats?.vendors?.total_vendors?.toLocaleString() || "0",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      description: "Active vendors in network",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Claims",
      value: stats?.claims?.open_claims?.toString() || "0",
      change: "+5%",
      changeType: "positive" as const,
      icon: FileText,
      description: "Claims in progress",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Scheduled Follow-ups",
      value: stats?.followups?.scheduled_followups?.toString() || "0",
      change: "Due this week",
      changeType: "neutral" as const,
      icon: Calendar,
      description: "Upcoming meetings",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Total Claim Value",
      value: stats?.claims?.total_claim_amount ? `$${(stats.claims.total_claim_amount / 1000000).toFixed(1)}M` : "$0",
      change: "+8.3%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "Claims portfolio value",
      gradient: "from-orange-500 to-orange-600",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "vendor",
      action: "New vendor registered",
      details: "Santos Saul Rivera - Unlimited AC Services",
      time: "2 hours ago",
      status: "success",
    },
    {
      id: 2,
      type: "followup",
      action: "Follow-up completed",
      details: "Priscila - Plumbing project discussion",
      time: "4 hours ago",
      status: "success",
    },
    {
      id: 3,
      type: "claim",
      action: "Claim updated",
      details: "Claim #42 status changed to In Progress",
      time: "6 hours ago",
      status: "warning",
    },
    {
      id: 4,
      type: "followup",
      action: "Follow-up scheduled",
      details: "Jorge Cappelletti - Roofing consultation",
      time: "1 day ago",
      status: "info",
    },
  ]

  const quickActions = [
    {
      title: "Add Vendor",
      description: "Register new contractor",
      icon: Users,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      href: "https://pricelist.globaladjustersfla.com",
      permission: Permission.CREATE_VENDORS,
    },
    {
      title: "New Claim",
      description: "Create insurance claim",
      icon: FileText,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      href: "/dashboard/claims",
      permission: Permission.CREATE_CLAIMS,
    },
    {
      title: "Schedule Follow-up",
      description: "Plan vendor meeting",
      icon: Calendar,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      href: "/dashboard/followups",
      permission: Permission.CREATE_FOLLOWUPS,
    },
    {
      title: "View Reports",
      description: "Analytics dashboard",
      icon: TrendingUp,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      href: "/dashboard/analytics",
      permission: Permission.VIEW_ANALYTICS,
    },
  ].filter((action) => checkPermission(action.permission))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card
            key={stat.title}
            className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    stat.changeType === "positive"
                      ? "default"
                      : stat.changeType === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs shadow-sm"
                >
                  {stat.changeType === "positive" && <ArrowUpRight className="h-3 w-3 mr-1" />}
                  {stat.change}
                </Badge>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest updates from your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-500" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) =>
                action.title === "Add Vendor" ? (
                  <a
                    key={action.title}
                    href={action.href}
                    className="h-auto p-4 flex flex-col items-center space-y-3 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className={`p-3 rounded-xl ${action.color} shadow-lg`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </a>
                ) : (
                  <Button
                    key={action.title}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-3 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white border-gray-200"
                    asChild
                  >
                    <a href={action.href}>
                      <div className={`p-3 rounded-xl ${action.color} shadow-lg`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </a>
                  </Button>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span>Performance Overview</span>
          </CardTitle>
          <CardDescription>Key metrics and progress indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Vendor Onboarding</span>
                <span className="text-sm text-blue-700 font-semibold">85%</span>
              </div>
              <Progress value={85} className="h-3" />
              <p className="text-xs text-blue-600">17 of 20 vendors completed</p>
            </div>
            <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-900">Claims Processing</span>
                <span className="text-sm text-green-700 font-semibold">92%</span>
              </div>
              <Progress value={92} className="h-3" />
              <p className="text-xs text-green-600">82 of 89 claims processed</p>
            </div>
            <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-900">Follow-up Success</span>
                <span className="text-sm text-purple-700 font-semibold">78%</span>
              </div>
              <Progress value={78} className="h-3" />
              <p className="text-xs text-purple-600">156 of 200 follow-ups completed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
