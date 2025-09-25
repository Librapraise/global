import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)

    const claimHistory = await sql`
      SELECT * FROM vendor_claim_history 
      WHERE vendor_id = ${vendorId}
      ORDER BY claim_date DESC
      LIMIT 10
    `

    return NextResponse.json(claimHistory)
  } catch (error) {
    console.error("[v0] Error fetching claim history:", error)
    return NextResponse.json({ error: "Failed to fetch claim history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)
    const { claim_date, claim_number, claim_amount, claim_status, insurance_company, notes, created_by } =
      await request.json()

    const result = await sql`
      INSERT INTO vendor_claim_history (vendor_id, claim_date, claim_number, claim_amount, claim_status, insurance_company, notes, created_by)
      VALUES (${vendorId}, ${claim_date}, ${claim_number}, ${claim_amount}, ${claim_status}, ${insurance_company}, ${notes}, ${created_by})
      RETURNING *
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error creating claim history:", error)
    return NextResponse.json({ error: "Failed to create claim history" }, { status: 500 })
  }
}
