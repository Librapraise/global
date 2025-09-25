import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// GET /api/followups/[id]/contacts - Get contact interactions for a followup
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const followupId = Number.parseInt(params.id)

    if (isNaN(followupId)) {
      return NextResponse.json({ error: "Invalid followup ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT 
        ci.*,
        v.name as vendor_name
      FROM followup_contact_interactions ci
      JOIN vendors v ON ci.vendor_id = v.id
      WHERE ci.followup_id = ${followupId}
      ORDER BY ci.interaction_date DESC
    `

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching contact interactions:", error)
    return NextResponse.json({ error: "Failed to fetch contact interactions" }, { status: 500 })
  }
}

// POST /api/followups/[id]/contacts - Add new contact interaction
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const followupId = Number.parseInt(params.id)

    if (isNaN(followupId)) {
      return NextResponse.json({ error: "Invalid followup ID" }, { status: 400 })
    }

    const body = await request.json()
    const { vendor_id, interaction_type, answered, call_rating, notes, created_by } = body

    // Validate required fields
    if (!vendor_id || !interaction_type) {
      return NextResponse.json({ error: "vendor_id and interaction_type are required" }, { status: 400 })
    }

    // Validate interaction_type
    const validTypes = ["call", "voicemail", "text", "email"]
    if (!validTypes.includes(interaction_type)) {
      return NextResponse.json({ error: "Invalid interaction_type" }, { status: 400 })
    }

    // Validate call_rating if provided
    if (call_rating !== undefined && (call_rating < 1 || call_rating > 5)) {
      return NextResponse.json({ error: "call_rating must be between 1 and 5" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO followup_contact_interactions (
        followup_id, 
        vendor_id, 
        interaction_type, 
        answered, 
        call_rating, 
        notes, 
        created_by
      )
      VALUES (
        ${followupId}, 
        ${vendor_id}, 
        ${interaction_type}, 
        ${answered || false}, 
        ${call_rating || null}, 
        ${notes || ""}, 
        ${created_by || "user"}
      )
      RETURNING *
    `

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating contact interaction:", error)
    return NextResponse.json({ error: "Failed to create contact interaction" }, { status: 500 })
  }
}
