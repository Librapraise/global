import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const permissions = await sql`
      SELECT 
        id,
        name,
        description,
        resource,
        action,
        created_at
      FROM permissions
      ORDER BY resource, action
    `

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, resource, action } = await request.json()

    if (!name || !resource || !action) {
      return NextResponse.json({ error: "Name, resource, and action are required" }, { status: 400 })
    }

    const [permission] = await sql`
      INSERT INTO permissions (name, description, resource, action)
      VALUES (${name}, ${description}, ${resource}, ${action})
      RETURNING *
    `

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error("Error creating permission:", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "Permission name already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 })
  }
}
