"use client"

import { useEffect, useState } from "react"
import { hasPermission, hasAnyPermission, type Permission, type User } from "@/lib/permissions"

export function usePermissions() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
        setUser(null)
      }
    }
  }, [])

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(user, permission)
  }

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return hasAnyPermission(user, permissions)
  }

  const isAdmin = (): boolean => {
    return user?.is_admin === true
  }

  const isSuperAdmin = (): boolean => {
    return user?.is_admin === true && user?.role === "super_admin"
  }

  const getRole = (): string => {
    return user?.role || "viewer"
  }

  const getCompanyTag = (): string => {
    return user?.company_tag || ""
  }

  return {
    user,
    checkPermission,
    checkAnyPermission,
    isAdmin,
    isSuperAdmin,
    getRole,
    getCompanyTag,
  }
}
