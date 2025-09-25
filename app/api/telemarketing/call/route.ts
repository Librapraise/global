import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { DatabaseOperations } from "@/lib/database"

const db = new DatabaseOperations()

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { to_number, lead_id } = await request.json()

    // Get user's assigned telemarketing number
    const numberResult = await db.sql`
      SELECT tn.* FROM telemarketing_numbers tn
      WHERE tn.assigned_user_id = ${user.id} AND tn.is_active = true
      LIMIT 1
    `

    if (numberResult.length === 0) {
      return NextResponse.json({ error: "No telemarketing number assigned" }, { status: 400 })
    }

    const telemarketingNumber = numberResult[0]

    // Initialize Twilio call (placeholder for actual Twilio integration)
    const callData = {
      from: telemarketingNumber.phone_number,
      to: to_number,
      user_id: user.id,
      lead_id: lead_id,
      status: "initiated",
      created_at: new Date().toISOString(),
    }

    // Log the call attempt
    await db.sql`
      INSERT INTO lead_interactions (lead_id, user_id, interaction_type, notes, created_at)
      VALUES (${lead_id}, ${user.id}, 'call_initiated', ${`Call initiated to ${to_number} from ${telemarketingNumber.phone_number}`}, CURRENT_TIMESTAMP)
    `

    // TODO: Integrate with actual Twilio API
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    // const call = await client.calls.create({
    //   from: telemarketingNumber.phone_number,
    //   to: to_number,
    //   url: 'http://demo.twilio.com/docs/voice.xml'
    // })

    return NextResponse.json({
      success: true,
      call: callData,
      message: "Call initiated successfully",
    })
  } catch (error) {
    console.error("Error initiating call:", error)
    return NextResponse.json({ error: "Failed to initiate call" }, { status: 500 })
  }
}
