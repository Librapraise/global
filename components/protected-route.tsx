"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { hasPermission, hasAnyPermission, type Permission, type User } from "@/lib/permissions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldX, ArrowLeft } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions = [],
  fallback,
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/")
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check permissions
  const permissions =
    requiredPermissions.length > 0 ? requiredPermissions : requiredPermission ? [requiredPermission] : []

  if (permissions.length > 0) {
    const hasAccess =
      requiredPermissions.length > 0
        ? hasAnyPermission(user, requiredPermissions)
        : hasPermission(user, requiredPermission!)

    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <Alert className="border-red-200 bg-red-50">
              <ShieldX className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-2">Access Denied</div>
                <div className="text-sm mb-4">
                  You don't have permission to access this page. Please contact your administrator if you believe this
                  is an error.
                </div>
                <div className="text-xs text-red-600 mb-4">
                  Required role: {permissions.join(", ")}
                  <br />
                  Your role: {user.role}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Go Back
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
