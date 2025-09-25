import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roleId = Number.parseInt(params.id)

    const [role] = await sql`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.is_active,
        r.created_at,
        r.updated_at
      FROM roles r
      WHERE r.id = ${roleId}
    `

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Get permissions for this role
    const permissions = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.resource,
        p.action
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ${roleId}
      ORDER BY p.resource, p.action
    `

    return NextResponse.json({ ...role, permissions })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roleId = Number.parseInt(params.id)
    const { name, description, is_active } = await request.json()

    const [role] = await sql`
      UPDATE roles 
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${roleId}
      RETURNING *
    `

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error("Error updating role:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roleId = Number.parseInt(params.id)

    // Check if role has users assigned
    const [userCount] = await sql`
      SELECT COUNT(*) as count FROM user_roles WHERE role_id = ${roleId} AND is_active = true
    `

    if (userCount.count > 0) {
      return NextResponse.json({ error: "Cannot delete role with assigned users" }, { status: 400 })
    }

    await sql`DELETE FROM roles WHERE id = ${roleId}`

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 })
  }
}
