import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission, Permission } from "@/lib/permissions"

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !hasPermission(currentUser, Permission.SYSTEM_SETTINGS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { users } = body

    if (!Array.isArray(users)) {
      return NextResponse.json({ error: "Users must be an array" }, { status: 400 })
    }

    const updatePromises = users.map(async (userData) => {
      const { user: userId, numbers, script, lead_lists } = userData

      if (!userId) return null

      try {
        // Update user's telemarketing settings
        await sql`
          UPDATE users 
          SET 
            telemarketing_script_id = ${script || null},
            telemarketing_lead_list_ids = ${lead_lists || []},
            updated_at = NOW()
          WHERE id = ${userId}
        `

        // Update phone number assignments if provided
        if (numbers && numbers.length > 0) {
          // First, clear existing assignments for this user
          await sql`
            UPDATE telemarketing_numbers 
            SET assigned_user_id = NULL, updated_at = NOW()
            WHERE assigned_user_id = ${userId}
          `

          // Assign new numbers
          for (const phoneNumber of numbers) {
            await sql`
              UPDATE telemarketing_numbers 
              SET assigned_user_id = ${userId}, updated_at = NOW()
              WHERE phone_number = ${phoneNumber} AND is_active = true
            `
          }
        }

        return { userId, success: true }
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error)
        return { userId, success: false, error: error.message }
      }
    })

    const results = await Promise.all(updatePromises)
    const successCount = results.filter((r) => r?.success).length
    const failureCount = results.filter((r) => r && !r.success).length

    return NextResponse.json({
      success: true,
      message: `Updated ${successCount} users successfully${failureCount > 0 ? `, ${failureCount} failed` : ""}`,
      results: results.filter((r) => r !== null),
    })
  } catch (error) {
    console.error("Error bulk updating users:", error)
    return NextResponse.json(
      {
        error: "Failed to bulk update users",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
