import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TelemarketingManagement } from "@/components/telemarketing-management"
import { ProtectedRoute } from "@/components/protected-route"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Telemarketing System - Global Public Adjusters",
  description:
    "Advanced telemarketing lead management system for Global Public Adjusters. Manage leads, assign telemarketers, track interactions, and monitor conversion rates.",
  robots: "noindex, nofollow", // Protected pages should not be indexed
}

export default function TelemarketingPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.VIEW_TELEMARKETING}>
        <TelemarketingManagement />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
