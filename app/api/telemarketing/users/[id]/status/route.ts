import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"
import { hasPermission, Permission } from "@/lib/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()

    if (!user || !hasPermission(user, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { is_active } = await request.json()
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Update user status
    await sql`
      UPDATE users 
      SET is_active = ${is_active}, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
