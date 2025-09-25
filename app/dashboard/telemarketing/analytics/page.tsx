import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { CallAnalyticsDashboard } from "@/components/call-analytics-dashboard"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Call Analytics - Global Public Adjusters",
  description: "Comprehensive call analytics and performance insights for telemarketing operations.",
  keywords: "call analytics, telemarketing performance, conversion rates, Global Public Adjusters",
  robots: "noindex, nofollow",
}

export default function CallAnalyticsPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.SYSTEM_SETTINGS}>
        <CallAnalyticsDashboard />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
