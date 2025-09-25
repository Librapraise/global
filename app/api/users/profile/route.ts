import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest) {
  try {
    const { name, email, phone, currentPassword, newPassword } = await request.json()

    // Get current user from session (you might want to implement proper session management)
    const userEmail = email // This should come from session/auth token

    // Verify current user exists
    const users = await sql`
      SELECT * FROM users WHERE email = ${userEmail} AND is_active = true
    `

    if (users.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: "Current password required" }, { status: 400 })
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ message: "Invalid current password" }, { status: 400 })
      }
    }

    let updatedUsers
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      updatedUsers = await sql`
        UPDATE users 
        SET name = ${name}, 
            email = ${email}, 
            phone = ${phone}, 
            password_hash = ${hashedPassword},
            updated_at = ${new Date().toISOString()}
        WHERE id = ${user.id}
        RETURNING id, name, email, phone, role, is_admin, is_active, company_tag, created_at, updated_at
      `
    } else {
      updatedUsers = await sql`
        UPDATE users 
        SET name = ${name}, 
            email = ${email}, 
            phone = ${phone}, 
            updated_at = ${new Date().toISOString()}
        WHERE id = ${user.id}
        RETURNING id, name, email, phone, role, is_admin, is_active, company_tag, created_at, updated_at
      `
    }

    return NextResponse.json({ user: updatedUsers[0] })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
