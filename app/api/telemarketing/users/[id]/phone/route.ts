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

    const { phone_number } = await request.json()
    const userId = Number.parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // Update or insert phone number in telemarketing_numbers table
    await sql`
      INSERT INTO telemarketing_numbers (user_id, twilio_phone_number, is_active, created_at)
      VALUES (${userId}, ${phone_number}, true, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        twilio_phone_number = ${phone_number},
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user phone:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
