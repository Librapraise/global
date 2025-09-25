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

    const { phoneNumber } = await request.json()

    // Mock purchase - in production this would call Twilio API to purchase the number
    const mockSid = `PN${Math.random().toString(36).substr(2, 32)}`

    // Add to database
    const result = await db.sql`
      INSERT INTO telemarketing_numbers (phone_number, friendly_name, twilio_sid, status, created_at)
      VALUES (${phoneNumber}, ${phoneNumber}, ${mockSid}, 'active', NOW())
      RETURNING *
    `

    return NextResponse.json({ success: true, number: result[0] })
  } catch (error) {
    console.error("Error purchasing number:", error)
    return NextResponse.json({ error: "Failed to purchase number" }, { status: 500 })
  }
}
