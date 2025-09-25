import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)

    const notes = await sql`
      SELECT id, note, created_by, created_at, updated_at
      FROM vendor_notes 
      WHERE vendor_id = ${vendorId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching vendor notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)
    const { note } = await request.json()

    const result = await sql`
      INSERT INTO vendor_notes (vendor_id, note, created_by, created_at, updated_at)
      VALUES (${vendorId}, ${note}, 'admin', NOW(), NOW())
      RETURNING id, note, created_by, created_at, updated_at
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error saving vendor note:", error)
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 })
  }
}
