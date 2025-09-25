import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorManagement } from "@/components/vendor-management"
import { ProtectedRoute } from "@/components/protected-route"
import { Permission } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Vendor Management - Global Public Adjusters",
  description:
    "Manage contractor network and vendor relationships for Global Public Adjusters. View vendor details, track notes, fees, pricing, and maintain comprehensive vendor records with role-based access control.",
  robots: "noindex, nofollow", // Protected pages should not be indexed
}

export default function VendorsPage() {
  return (
    <DashboardLayout>
      <ProtectedRoute requiredPermission={Permission.VIEW_VENDORS}>
        <VendorManagement />
      </ProtectedRoute>
    </DashboardLayout>
  )
}
