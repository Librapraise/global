import type { Metadata } from "next"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"

export const metadata: Metadata = {
  title: "Dashboard - Global Public Adjusters",
  description:
    "Main dashboard for Global Public Adjusters contractor network management system. Access quick links, system overview, and navigation to all management tools.",
  robots: "noindex, nofollow", // Dashboard should not be indexed
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
}
