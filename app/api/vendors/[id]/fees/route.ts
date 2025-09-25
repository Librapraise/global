import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)

    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    const fees = await sql`
      SELECT id, vendor_id, fee_type, amount, description, has_fee, created_at
      FROM vendor_fees 
      WHERE vendor_id = ${vendorId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(fees)
  } catch (error) {
    console.error("Error fetching vendor fees:", error)
    return NextResponse.json({ error: "Failed to fetch vendor fees" }, { status: 500 })
  }
}
