import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.vendor_id || !body.scheduled_date) {
      return NextResponse.json({ error: "Vendor ID and scheduled date are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO followup_schedules (
        vendor_id, 
        scheduled_date, 
        scheduled_time, 
        meeting_type, 
        organizer, 
        address, 
        notes, 
        status, 
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        ${body.vendor_id},
        ${body.scheduled_date},
        ${body.scheduled_time || "10:00"},
        ${body.meeting_type || "Phone Call"},
        ${body.organizer || ""},
        ${body.address || ""},
        ${body.notes || ""},
        ${body.status || "Scheduled"},
        ${body.created_by || "Admin"},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Error creating followup schedule:", error)
    return NextResponse.json({ error: "Failed to create followup schedule" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get("vendorId")

    let query = `
      SELECT fs.*, v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email
      FROM followup_schedules fs
      LEFT JOIN vendors v ON fs.vendor_id = v.id
      ORDER BY fs.scheduled_date DESC, fs.scheduled_time DESC
    `

    const params = []
    if (vendorId) {
      query = `
        SELECT fs.*, v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email
        FROM followup_schedules fs
        LEFT JOIN vendors v ON fs.vendor_id = v.id
        WHERE fs.vendor_id = $1
        ORDER BY fs.scheduled_date DESC, fs.scheduled_time DESC
      `
      params.push(vendorId)
    }

    const result = await sql(query, params)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching followup schedules:", error)
    return NextResponse.json({ error: "Failed to fetch followup schedules" }, { status: 500 })
  }
}
