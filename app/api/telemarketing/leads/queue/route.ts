import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const leads = await sql`
      SELECT * FROM telemarketing_leads 
      WHERE status IN ('New', 'Warm', 'Hot')
      AND (last_contacted IS NULL OR last_contacted < NOW() - INTERVAL '1 hour')
      ORDER BY priority DESC, created_at ASC
      LIMIT 10
    `

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching lead queue:", error)
    return NextResponse.json({ error: "Failed to fetch lead queue" }, { status: 500 })
  }
}
