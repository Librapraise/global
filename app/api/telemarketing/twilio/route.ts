import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { DatabaseOperations } from "@/lib/database"

const db = new DatabaseOperations()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's assigned telemarketing number
    const result = await db.sql`
      SELECT tn.*, u.name as assigned_user_name
      FROM telemarketing_numbers tn
      LEFT JOIN users u ON tn.assigned_user_id = u.id
      WHERE tn.assigned_user_id = ${user.id} OR ${user.is_admin}
      ORDER BY tn.created_at DESC
    `

    return NextResponse.json({ numbers: result })
  } catch (error) {
    console.error("Error fetching telemarketing numbers:", error)
    return NextResponse.json({ error: "Failed to fetch numbers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, phoneNumber, leadId, userId, callSid } = await request.json()

    if (action === "initiate_call") {
      // In a real implementation, this would use Twilio SDK to initiate calls
      // For now, we'll simulate the call initiation
      const mockCallSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`

      // Log the call attempt
      await db.sql`
        INSERT INTO lead_call_history (lead_id, user_id, call_start, session_id, notes)
        VALUES (${leadId}, ${userId}, NOW(), ${mockCallSid}, 'Call initiated via auto dialer')
      `

      // Update lead last contacted
      await db.sql`
        UPDATE telemarketing_leads 
        SET last_contacted = NOW()
        WHERE id = ${leadId}
      `

      return NextResponse.json({
        success: true,
        callSid: mockCallSid,
        message: "Call initiated successfully",
      })
    }

    if (action === "end_call") {
      // End the call and update records
      await db.sql`
        UPDATE lead_call_history 
        SET call_end = NOW(), duration = EXTRACT(EPOCH FROM (NOW() - call_start))::integer
        WHERE session_id = ${callSid}
      `

      return NextResponse.json({
        success: true,
        message: "Call ended successfully",
      })
    }

    // Original admin functionality for managing telemarketing numbers
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { phone_number, friendly_name, twilio_sid, assigned_user_id } = await request.json()

    const result = await db.sql`
      INSERT INTO telemarketing_numbers (phone_number, friendly_name, twilio_sid, assigned_user_id)
      VALUES (${phone_number}, ${friendly_name}, ${twilio_sid}, ${assigned_user_id})
      RETURNING *
    `

    return NextResponse.json({ number: result[0] })
  } catch (error) {
    console.error("Error processing Twilio request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
