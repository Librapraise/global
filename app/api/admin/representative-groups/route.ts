import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const groups = await sql`
      SELECT 
        rg.*,
        COUNT(rgm.user_id) as member_count
      FROM representative_groups rg
      LEFT JOIN representative_group_members rgm ON rg.id = rgm.group_id
      GROUP BY rg.id
      ORDER BY rg.name
    `

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching representative groups:", error)
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, lead_representative } = await request.json()

    const result = await sql`
      INSERT INTO representative_groups (name, description, lead_representative)
      VALUES (${name}, ${description}, ${lead_representative})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating representative group:", error)
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
  }
}
