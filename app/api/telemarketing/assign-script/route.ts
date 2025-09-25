import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hasPermission, Permission } from "@/lib/permissions"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || !hasPermission(user, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { user_id, script_id } = await request.json()

    if (!user_id || !script_id) {
      return NextResponse.json({ error: "User ID and Script ID are required" }, { status: 400 })
    }

    // Check if assignment already exists
    const existing = await sql`
      SELECT id FROM telemarketing_script_assignments
      WHERE user_id = ${user_id} AND script_id = ${script_id}
    `

    if (existing.length > 0) {
      // Reactivate if exists but inactive
      await sql`
        UPDATE telemarketing_script_assignments
        SET is_active = true, updated_at = NOW()
        WHERE user_id = ${user_id} AND script_id = ${script_id}
      `
    } else {
      // Create new assignment
      await sql`
        INSERT INTO telemarketing_script_assignments (user_id, script_id, assigned_by, is_active, created_at)
        VALUES (${user_id}, ${script_id}, ${user.id}, true, NOW())
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error assigning script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
