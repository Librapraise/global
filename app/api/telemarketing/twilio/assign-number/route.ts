import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { DatabaseOperations } from "@/lib/database"

const db = new DatabaseOperations()

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { number_sid, user_id } = await request.json()

    // Update number assignment
    const result = await db.sql`
      UPDATE telemarketing_numbers 
      SET assigned_user_id = ${user_id}, updated_at = NOW()
      WHERE twilio_sid = ${number_sid}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, number: result[0] })
  } catch (error) {
    console.error("Error assigning number:", error)
    return NextResponse.json({ error: "Failed to assign number" }, { status: 500 })
  }
}
