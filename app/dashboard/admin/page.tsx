import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminSettings } from "@/components/admin-settings"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Admin Settings - Global Public Adjusters",
  description:
    "Administrative dashboard for managing users, vendor relations, and representative assignments at Global Public Adjusters. Control access permissions and system settings.",
  keywords: "admin, user management, vendor relations, representatives, Global Public Adjusters, system settings",
  robots: "noindex, nofollow", // Admin pages should not be indexed
}

export default function AdminPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.SYSTEM_SETTINGS}>
        <AdminSettings />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
