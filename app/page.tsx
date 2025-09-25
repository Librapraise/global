import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"

export const metadata: Metadata = {
  title: "Admin Login - Global Public Adjusters",
  description:
    "Secure login portal for Global Public Adjusters contractor network management system. Access vendor management, claims processing, and administrative tools.",
  robots: "noindex, nofollow", // Login pages should not be indexed
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
