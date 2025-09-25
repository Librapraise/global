"use client"

import type React from "react"

import { usePermissions } from "@/hooks/use-permissions"
import type { Permission } from "@/lib/permissions"

interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean
}

interface MultiplePermissionGuardProps {
  permissions: Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAll?: boolean
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { checkPermission } = usePermissions()

  if (!checkPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export function MultiplePermissionGuard({
  permissions,
  children,
  fallback = null,
  requireAll = false,
}: MultiplePermissionGuardProps) {
  const { checkAnyPermission, checkPermission } = usePermissions()

  const hasAccess = requireAll
    ? permissions.every((permission) => checkPermission(permission))
    : checkAnyPermission(permissions)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Higher-order component for permission-based rendering
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ReactNode,
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// Hook for conditional rendering based on permissions
export function useConditionalRender() {
  const { checkPermission, checkAnyPermission } = usePermissions()

  const renderIf = (permission: Permission, component: React.ReactNode, fallback?: React.ReactNode) => {
    return checkPermission(permission) ? component : fallback || null
  }

  const renderIfAny = (permissions: Permission[], component: React.ReactNode, fallback?: React.ReactNode) => {
    return checkAnyPermission(permissions) ? component : fallback || null
  }

  const renderIfAll = (permissions: Permission[], component: React.ReactNode, fallback?: React.ReactNode) => {
    const hasAll = permissions.every((permission) => checkPermission(permission))
    return hasAll ? component : fallback || null
  }

  return { renderIf, renderIfAny, renderIfAll }
}
