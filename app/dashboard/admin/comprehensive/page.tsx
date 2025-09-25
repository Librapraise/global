import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { ComprehensiveAdminDashboard } from "@/components/comprehensive-admin-dashboard"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Comprehensive Admin Dashboard - Global Public Adjusters",
  description:
    "Complete administrative control center for managing users, roles, permissions, and system settings at Global Public Adjusters. Monitor system health and audit activities.",
  keywords: "admin dashboard, user management, role management, system administration, Global Public Adjusters",
  robots: "noindex, nofollow",
}

export default function ComprehensiveAdminPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.SYSTEM_SETTINGS}>
        <ComprehensiveAdminDashboard />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
