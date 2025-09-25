import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { TelemarketingAdminDashboard } from "@/components/telemarketing-admin-dashboard"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Telemarketing Admin - Global Public Adjusters",
  description: "Administrative dashboard for managing telemarketing users, scripts, and lead assignments.",
  keywords: "telemarketing admin, user management, scripts, leads, Global Public Adjusters",
  robots: "noindex, nofollow",
}

export default function TelemarketingAdminPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.SYSTEM_SETTINGS}>
        <TelemarketingAdminDashboard />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
