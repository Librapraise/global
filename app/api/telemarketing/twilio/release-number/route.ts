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

    const { number_sid } = await request.json()

    // Mock release - in production this would call Twilio API to release the number
    // For now, just remove from database
    const result = await db.sql`
      DELETE FROM telemarketing_numbers 
      WHERE twilio_sid = ${number_sid}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error releasing number:", error)
    return NextResponse.json({ error: "Failed to release number" }, { status: 500 })
  }
}
