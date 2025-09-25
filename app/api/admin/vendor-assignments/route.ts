import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const assignments = await sql`
      SELECT 
        vra.*,
        v.name as vendor_name,
        v.business_name,
        rg.name as group_name
      FROM vendor_representative_assignments vra
      JOIN vendors v ON vra.vendor_id = v.id
      JOIN representative_groups rg ON vra.representative_group_id = rg.id
      ORDER BY v.name
    `

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Error fetching vendor assignments:", error)
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vendor_id, representative_group_id } = await request.json()

    const result = await sql`
      INSERT INTO vendor_representative_assignments (vendor_id, representative_group_id)
      VALUES (${vendor_id}, ${representative_group_id})
      ON CONFLICT (vendor_id, representative_group_id) DO NOTHING
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating vendor assignment:", error)
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
  }
}
