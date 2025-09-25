import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get the next lead that hasn't been called recently
    const leads = await sql`
      SELECT * FROM telemarketing_leads 
      WHERE status IN ('New', 'Warm', 'Hot')
      AND (last_contacted IS NULL OR last_contacted < NOW() - INTERVAL '1 hour')
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `

    if (leads.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(leads[0])
  } catch (error) {
    console.error("Error fetching current lead:", error)
    return NextResponse.json({ error: "Failed to fetch current lead" }, { status: 500 })
  }
}
