import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = Number.parseInt(params.id)
    const body = await request.json()
    const { follow_up_date, notes, created_by } = body

    // Get the lead details
    const [lead] = await sql`
      SELECT * FROM telemarketing_leads WHERE id = ${leadId}
    `

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (lead.converted_to_followup_id) {
      return NextResponse.json({ error: "Lead already converted to follow-up" }, { status: 400 })
    }

    // Check if vendor already exists with this company name and phone/email
    let vendor
    const existingVendors = await sql`
      SELECT * FROM vendors 
      WHERE business_name ILIKE ${lead.company_name}
      OR (phone = ${lead.phone} AND phone IS NOT NULL)
      OR (email = ${lead.email} AND email IS NOT NULL)
      LIMIT 1
    `

    if (existingVendors.length > 0) {
      vendor = existingVendors[0]
    } else {
      // Create new vendor from lead
      const [newVendor] = await sql`
        INSERT INTO vendors (
          name, business_name, phone, email, location, trade_type,
          created_from_lead_id, created_at, updated_at
        ) VALUES (
          ${lead.contact_person || lead.company_name},
          ${lead.company_name},
          ${lead.phone},
          ${lead.email},
          ${lead.address},
          ${lead.industry},
          ${leadId},
          NOW(),
          NOW()
        )
        RETURNING *
      `
      vendor = newVendor
    }

    // Create follow-up
    const [followup] = await sql`
      INSERT INTO vendor_followups (
        vendor_id, follow_up_date, status, notes, created_by,
        created_from_lead_id, created_at, updated_at
      ) VALUES (
        ${vendor.id},
        ${follow_up_date || new Date().toISOString().split("T")[0]},
        'scheduled',
        ${notes || lead.notes},
        ${created_by},
        ${leadId},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    // Update lead status and conversion info
    await sql`
      UPDATE telemarketing_leads 
      SET 
        status = 'converted_to_followup',
        converted_to_vendor_id = ${vendor.id},
        converted_to_followup_id = ${followup.id},
        conversion_date = NOW(),
        updated_at = NOW()
      WHERE id = ${leadId}
    `

    return NextResponse.json(
      {
        message: "Lead successfully converted to follow-up",
        vendor,
        followup,
        lead_id: leadId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error converting lead to follow-up:", error)
    return NextResponse.json({ error: "Failed to convert lead to follow-up" }, { status: 500 })
  }
}
