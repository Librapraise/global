import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const followupId = Number.parseInt(params.id)
    const body = await request.json()

    console.log("[v0] Completing follow-up ID:", followupId)
    console.log("[v0] Received completion data:", body)

    const { answered, voicemail, text, zoom, in_person, email, rating, notes } = body

    const completionDate = new Date()
    console.log("[v0] Setting completion date:", completionDate)

    const result = await sql`
      UPDATE vendor_followups 
      SET 
        answered = ${answered || false},
        voicemail = ${voicemail || false},
        text_sent = ${text || false},
        zoom_meeting = ${zoom || false},
        in_person_meeting = ${in_person || false},
        email_sent = ${email || false},
        last_call_rating = ${rating || 1},
        notes = ${notes || ""},
        completed_date = ${completionDate},
        status = 'completed',
        updated_at = ${new Date()}
      WHERE id = ${followupId}
      RETURNING *
    `

    console.log("[v0] Database update result:", result)

    if (result.length === 0) {
      console.log("[v0] Follow-up not found for ID:", followupId)
      return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })
    }

    const completedFollowup = result[0]
    console.log("[v0] Follow-up completed successfully:", completedFollowup)

    const vendorResult = await sql`
      SELECT id, name, business_name, phone, email, location, trade_type, representative
      FROM vendors 
      WHERE id = ${completedFollowup.vendor_id}
    `

    if (vendorResult.length > 0) {
      const vendor = vendorResult[0]
      console.log("[v0] Adding vendor back to not scheduled:", vendor.name)

      const existingFollowup = await sql`
        SELECT id FROM vendor_followups 
        WHERE vendor_id = ${vendor.id} 
        AND status IN ('pending', 'scheduled')
        LIMIT 1
      `

      if (existingFollowup.length === 0) {
        console.log("[v0] No existing pending follow-ups found, vendor will be available for new scheduling")
        // The vendor will automatically appear in the "not scheduled" section
        // because they don't have any pending follow-ups
      } else {
        console.log("[v0] Vendor already has pending follow-ups, not adding to not scheduled")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up completed successfully",
      data: completedFollowup,
    })
  } catch (error) {
    console.error("[v0] Error completing follow-up:", error)
    return NextResponse.json({ error: "Failed to complete follow-up" }, { status: 500 })
  }
}
