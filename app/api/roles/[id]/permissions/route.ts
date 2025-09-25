import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roleId = Number.parseInt(params.id)
    const { permission_ids } = await request.json()

    if (!Array.isArray(permission_ids)) {
      return NextResponse.json({ error: "permission_ids must be an array" }, { status: 400 })
    }

    // Remove existing permissions for this role
    await sql`DELETE FROM role_permissions WHERE role_id = ${roleId}`

    // Add new permissions
    if (permission_ids.length > 0) {
      const values = permission_ids.map((permissionId) => `(${roleId}, ${permissionId})`).join(", ")
      await sql.unsafe(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ${values}
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `)
    }

    return NextResponse.json({ message: "Permissions updated successfully" })
  } catch (error) {
    console.error("Error updating role permissions:", error)
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}
