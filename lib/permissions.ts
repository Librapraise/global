// Permission system for role-based access control
export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: string
  is_admin: boolean
  is_active: boolean
  company_tag: string
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin", // ensuring lowercase admin matches database
  MANAGER = "manager",
  USER = "user",
  VIEWER = "viewer",
}

export enum Permission {
  // Vendor permissions
  VIEW_VENDORS = "view_vendors",
  CREATE_VENDORS = "create_vendors",
  EDIT_VENDORS = "edit_vendors",
  DELETE_VENDORS = "delete_vendors",

  // Claims permissions
  VIEW_CLAIMS = "view_claims",
  CREATE_CLAIMS = "create_claims",
  EDIT_CLAIMS = "edit_claims",
  DELETE_CLAIMS = "delete_claims",

  // Follow-up permissions
  VIEW_FOLLOWUPS = "view_followups",
  CREATE_FOLLOWUPS = "create_followups",
  EDIT_FOLLOWUPS = "edit_followups",
  DELETE_FOLLOWUPS = "delete_followups",

  // Telemarketing permissions
  VIEW_TELEMARKETING = "view_telemarketing",
  CREATE_TELEMARKETING = "create_telemarketing",
  EDIT_TELEMARKETING = "edit_telemarketing",
  DELETE_TELEMARKETING = "delete_telemarketing",
  ASSIGN_LEADS = "assign_leads",

  // System permissions
  MANAGE_USERS = "manage_users",
  VIEW_ANALYTICS = "view_analytics",
  SYSTEM_SETTINGS = "system_settings",
}

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.VIEW_VENDORS,
    Permission.CREATE_VENDORS,
    Permission.EDIT_VENDORS,
    Permission.DELETE_VENDORS,
    Permission.VIEW_CLAIMS,
    Permission.CREATE_CLAIMS,
    Permission.EDIT_CLAIMS,
    Permission.DELETE_CLAIMS,
    Permission.VIEW_FOLLOWUPS,
    Permission.CREATE_FOLLOWUPS,
    Permission.EDIT_FOLLOWUPS,
    Permission.DELETE_FOLLOWUPS,
    Permission.VIEW_TELEMARKETING,
    Permission.CREATE_TELEMARKETING,
    Permission.EDIT_TELEMARKETING,
    Permission.DELETE_TELEMARKETING,
    Permission.ASSIGN_LEADS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.SYSTEM_SETTINGS,
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_VENDORS,
    Permission.CREATE_VENDORS,
    Permission.EDIT_VENDORS,
    Permission.DELETE_VENDORS,
    Permission.VIEW_CLAIMS,
    Permission.CREATE_CLAIMS,
    Permission.EDIT_CLAIMS,
    Permission.DELETE_CLAIMS,
    Permission.VIEW_FOLLOWUPS,
    Permission.CREATE_FOLLOWUPS,
    Permission.EDIT_FOLLOWUPS,
    Permission.DELETE_FOLLOWUPS,
    Permission.VIEW_TELEMARKETING,
    Permission.CREATE_TELEMARKETING,
    Permission.EDIT_TELEMARKETING,
    Permission.DELETE_TELEMARKETING,
    Permission.ASSIGN_LEADS,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.MANAGER]: [
    Permission.VIEW_VENDORS,
    Permission.CREATE_VENDORS,
    Permission.EDIT_VENDORS,
    Permission.VIEW_CLAIMS,
    Permission.CREATE_CLAIMS,
    Permission.EDIT_CLAIMS,
    Permission.VIEW_FOLLOWUPS,
    Permission.CREATE_FOLLOWUPS,
    Permission.EDIT_FOLLOWUPS,
    Permission.VIEW_TELEMARKETING,
    Permission.CREATE_TELEMARKETING,
    Permission.EDIT_TELEMARKETING,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.USER]: [
    Permission.VIEW_VENDORS,
    Permission.CREATE_VENDORS,
    Permission.VIEW_CLAIMS,
    Permission.CREATE_CLAIMS,
    Permission.VIEW_FOLLOWUPS,
    Permission.CREATE_FOLLOWUPS,
    Permission.VIEW_TELEMARKETING,
    Permission.CREATE_TELEMARKETING,
    Permission.EDIT_TELEMARKETING,
  ],
  [UserRole.VIEWER]: [
    Permission.VIEW_VENDORS,
    Permission.VIEW_CLAIMS,
    Permission.VIEW_FOLLOWUPS,
    Permission.VIEW_TELEMARKETING,
  ],
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user || !user.is_active) return false

  // Super admin bypass - check both role and is_admin flag
  if (user.is_admin || user.role === UserRole.SUPER_ADMIN) return true

  // Admin users get admin permissions
  if (user.role === UserRole.ADMIN) {
    const adminPermissions = ROLE_PERMISSIONS[UserRole.ADMIN] || []
    if (adminPermissions.includes(permission)) return true
  }

  const userRole = user.role as UserRole
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []

  return rolePermissions.includes(permission)
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission))
}

export function canAccessCompanyData(user: User | null, dataCompanyTag?: string): boolean {
  if (!user || !user.is_active) return false

  // Admin users can access all company data
  if (user.is_admin || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true

  // Users can only access data from their company
  if (!dataCompanyTag) return true // No company restriction

  return user.company_tag === dataCompanyTag
}

export function filterByCompanyAccess<T extends { company?: string }>(user: User | null, data: T[]): T[] {
  if (!user || !user.is_active) return []

  if (user.is_admin || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return data

  // Filter by company tag
  return data.filter((item) => !item.company || item.company === user.company_tag)
}

// Helper functions for admin checking
export function isAdmin(user: User | null): boolean {
  if (!user || !user.is_active) return false
  return user.is_admin || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
}

export function isSuperAdmin(user: User | null): boolean {
  if (!user || !user.is_active) return false
  return user.role === UserRole.SUPER_ADMIN
}
