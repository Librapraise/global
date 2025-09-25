import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const vendorId = Number.parseInt(params.id)

    if (isNaN(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    const pricing = await sql`
      SELECT id, vendor_id, service_name, item_name, price, price_range_from, price_range_to, unit, description, created_at
      FROM vendor_pricing 
      WHERE vendor_id = ${vendorId}
      ORDER BY service_name, item_name
    `

    return NextResponse.json(pricing)
  } catch (error) {
    console.error("Error fetching vendor pricing:", error)
    return NextResponse.json({ error: "Failed to fetch vendor pricing" }, { status: 500 })
  }
}
