import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const followupId = Number.parseInt(params.id)
    const body = await request.json()
    const { interaction_type, answered, interaction_date, call_rating, notes } = body

    const result = await sql`
      INSERT INTO followup_contact_interactions 
      (followup_id, interaction_type, answered, interaction_date, call_rating, notes, created_at, updated_at)
      VALUES (${followupId}, ${interaction_type}, ${answered}, ${interaction_date}, ${call_rating || null}, ${notes || ""}, NOW(), NOW())
      RETURNING *
    `

    await sql`
      UPDATE vendor_followups 
      SET 
        last_contact_date = ${interaction_date},
        total_interactions = COALESCE(total_interactions, 0) + 1,
        last_call_rating = ${call_rating || null},
        updated_at = NOW()
      WHERE id = ${followupId}
    `

    return NextResponse.json({ success: true, interaction: result[0] })
  } catch (error) {
    console.error("Error creating interaction:", error)
    return NextResponse.json({ error: "Failed to create interaction" }, { status: 500 })
  }
}
