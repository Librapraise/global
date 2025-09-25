import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import FollowupManagement from "@/components/followup-management"
import { ProtectedRoute } from "@/components/protected-route"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Follow-up System - Global Public Adjusters",
  description:
    "Advanced follow-up management system for Global Public Adjusters. Schedule vendor follow-ups, track contact interactions, manage completion status, and maintain comprehensive communication records.",
  robots: "noindex, nofollow", // Protected pages should not be indexed
}

export default function FollowupsPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.VIEW_FOLLOWUPS}>
        <FollowupManagement />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
