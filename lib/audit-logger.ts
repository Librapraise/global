import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface AuditLogEntry {
  user_id: number
  action: string
  resource_type: string
  resource_id?: number
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at
      ) VALUES (
        ${entry.user_id},
        ${entry.action},
        ${entry.resource_type},
        ${entry.resource_id || null},
        ${JSON.stringify(entry.details || {})},
        ${entry.ip_address || null},
        ${entry.user_agent || null},
        CURRENT_TIMESTAMP
      )
    `
  } catch (error) {
    console.error("Failed to log audit event:", error)
    // Don't throw - audit logging shouldn't break the main flow
  }
}

export const AuditActions = {
  // User actions
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_ACTIVATE: "user.activate",
  USER_DEACTIVATE: "user.deactivate",

  // Role actions
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",
  ROLE_ASSIGN: "role.assign",
  ROLE_REVOKE: "role.revoke",

  // Permission actions
  PERMISSION_GRANT: "permission.grant",
  PERMISSION_REVOKE: "permission.revoke",

  // Data access
  DATA_VIEW: "data.view",
  DATA_EXPORT: "data.export",

  // System actions
  SYSTEM_SETTINGS_UPDATE: "system.settings.update",
  SYSTEM_BACKUP: "system.backup",
} as const

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions]
