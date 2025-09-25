import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const dispositions = [
      { id: 1, name: "No Answer", category: "no_contact" },
      { id: 2, name: "Busy", category: "no_contact" },
      { id: 3, name: "Voicemail", category: "no_contact" },
      { id: 4, name: "Not Interested", category: "negative" },
      { id: 5, name: "Callback Scheduled", category: "positive" },
      { id: 6, name: "Appointment Set", category: "positive" },
      { id: 7, name: "Sale", category: "positive" },
      { id: 8, name: "Do Not Call", category: "negative" },
      { id: 9, name: "Wrong Number", category: "invalid" },
      { id: 10, name: "Interested", category: "positive" },
    ]

    return NextResponse.json(dispositions)
  } catch (error) {
    console.error("Error fetching dispositions:", error)
    return NextResponse.json({ error: "Failed to fetch dispositions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { lead_id, disposition, disposition_notes, call_duration } = await request.json()

    // Insert disposition
    await sql`
      INSERT INTO call_dispositions (lead_id, disposition, disposition_notes, call_duration, call_timestamp, user_id)
      VALUES (${lead_id}, ${disposition}, ${disposition_notes}, ${call_duration || 0}, NOW(), 1)
    `

    // Update lead status and last contacted
    await sql`
      UPDATE telemarketing_leads 
      SET disposition = ${disposition}, 
          last_contacted = NOW(),
          disposition_notes = ${disposition_notes}
      WHERE id = ${lead_id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving disposition:", error)
    return NextResponse.json({ error: "Failed to save disposition" }, { status: 500 })
  }
}
