import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const roles = await sql`
      SELECT 
        r.id,
        r.name,
        r.description,
        r.is_active,
        r.created_at,
        r.updated_at,
        COUNT(ur.user_id) as user_count,
        COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.description, r.is_active, r.created_at, r.updated_at
      ORDER BY r.name
    `

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, is_active = true } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    const [role] = await sql`
      INSERT INTO roles (name, description, is_active)
      VALUES (${name}, ${description}, ${is_active})
      RETURNING *
    `

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 })
  }
}
