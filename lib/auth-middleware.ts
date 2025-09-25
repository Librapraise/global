import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: string
  is_admin: boolean
  is_active: boolean
  company_tag: string
  permissions: string[]
}

export async function validateSession(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // In a real app, you'd validate JWT token from Authorization header
    // For now, we'll use a simple session approach
    const sessionToken = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!sessionToken) {
      return null
    }

    // This is a simplified approach - in production, use proper JWT validation
    const userId = sessionToken // Assuming token contains user ID for now

    const [user] = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_admin,
        u.is_active,
        u.company_tag
      FROM users u
      WHERE u.id = ${userId} AND u.is_active = true
    `

    if (!user) {
      return null
    }

    // Get user permissions through roles
    const permissions = await sql`
      SELECT DISTINCT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ${user.id} AND ur.is_active = true
    `

    return {
      ...user,
      permissions: permissions.map((p: any) => p.name),
    }
  } catch (error) {
    console.error("Session validation error:", error)
    return null
  }
}

export function hasPermission(user: AuthenticatedUser | null, permission: string): boolean {
  if (!user || !user.is_active) return false

  // Super admin bypass
  if (user.is_admin || user.role === "super_admin") return true

  return user.permissions.includes(permission)
}

export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    const user = await validateSession(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!hasPermission(user, permission)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Add user to request context
    const response = NextResponse.next()
    response.headers.set("x-user-id", user.id.toString())
    response.headers.set("x-user-role", user.role)

    return response
  }
}
