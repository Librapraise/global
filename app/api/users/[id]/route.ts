import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const users = await sql.query(
      `
      SELECT id, name, email, role, is_admin, is_active, company_tag, rep,
             created_at, updated_at, last_login
      FROM users 
      WHERE id = $1
    `,
      [params.id],
    )

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, email, role, company_tag, is_admin, is_active, rep, password } = body

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`)
      values.push(email)
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`)
      values.push(role)
    }

    if (company_tag !== undefined) {
      updates.push(`company_tag = $${paramCount++}`)
      values.push(company_tag)
    }

    if (is_admin !== undefined) {
      updates.push(`is_admin = $${paramCount++}`)
      values.push(is_admin)
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      values.push(is_active)
    }

    if (rep !== undefined) {
      updates.push(`rep = $${paramCount++}`)
      values.push(rep)
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updates.push(`password_hash = $${paramCount++}`)
      values.push(hashedPassword)
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id)

    const users = await sql.query(
      `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, is_admin, is_active, company_tag, rep, updated_at
    `,
      values,
    )

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, email, role, company_tag, is_admin, is_active, rep, password } = body

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`)
      values.push(email)
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`)
      values.push(role)
    }

    if (company_tag !== undefined) {
      updates.push(`company_tag = $${paramCount++}`)
      values.push(company_tag)
    }

    if (is_admin !== undefined) {
      updates.push(`is_admin = $${paramCount++}`)
      values.push(is_admin)
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`)
      values.push(is_active)
    }

    if (rep !== undefined) {
      updates.push(`rep = $${paramCount++}`)
      values.push(rep)
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      updates.push(`password_hash = $${paramCount++}`)
      values.push(hashedPassword)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id)

    const users = await sql.query(
      `
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role, is_admin, is_active, company_tag, rep, updated_at
    `,
      values,
    )

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const users = await sql.query("DELETE FROM users WHERE id = $1 RETURNING id", [params.id])

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
