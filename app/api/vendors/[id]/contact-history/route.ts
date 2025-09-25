import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)

    const contactHistory = await sql`
      SELECT * FROM vendor_contact_history 
      WHERE vendor_id = ${vendorId}
      ORDER BY contact_date DESC
      LIMIT 10
    `

    return NextResponse.json(contactHistory)
  } catch (error) {
    console.error("[v0] Error fetching contact history:", error)
    return NextResponse.json({ error: "Failed to fetch contact history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)
    const { contact_date, contact_type, notes, created_by } = await request.json()

    const result = await sql`
      INSERT INTO vendor_contact_history (vendor_id, contact_date, contact_type, notes, created_by)
      VALUES (${vendorId}, ${contact_date}, ${contact_type}, ${notes}, ${created_by})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error creating contact history:", error)
    return NextResponse.json({ error: "Failed to create contact history" }, { status: 500 })
  }
}
