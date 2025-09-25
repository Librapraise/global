import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClaimsManagement } from "@/components/claims-management"
import { ProtectedRoute } from "@/components/protected-route"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Claims Management - Global Public Adjusters",
  description:
    "Comprehensive claims management system for Global Public Adjusters. Track insurance claims, manage claim details, and coordinate with vendors and contractors throughout the claims process.",
  robots: "noindex, nofollow", // Protected pages should not be indexed
}

export default function ClaimsPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.VIEW_CLAIMS}>
        <ClaimsManagement />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
