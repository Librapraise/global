import { type NextRequest, NextResponse } from "next/server"
import { TelemarketingOperations } from "@/lib/database"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const leadLists = await sql`
      SELECT 
        ll.*,
        u.name as created_by_name,
        COALESCE(lead_counts.lead_count, 0) as lead_count
      FROM telemarketing_lead_lists ll
      LEFT JOIN users u ON ll.created_by = u.id
      LEFT JOIN (
        SELECT list_id, COUNT(*) as lead_count
        FROM telemarketing_leads
        GROUP BY list_id
      ) lead_counts ON ll.id = lead_counts.list_id
      ORDER BY ll.created_at DESC
    `

    const formattedLists = leadLists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      lead_count: list.lead_count,
      created_at: list.created_at,
      created_by_name: list.created_by_name,
    }))

    return NextResponse.json({ leadLists: formattedLists })
  } catch (error) {
    console.error("Error fetching lead lists:", error)
    return NextResponse.json({ error: "Failed to fetch lead lists" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const description = (formData.get("description") as string) || ""
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!name) {
      return NextResponse.json({ error: "Lead list name is required" }, { status: 400 })
    }

    let rowCount = 0
    if (file && file.size > 0) {
      const csvText = await file.text()
      const lines = csvText.split("\n").filter((line) => line.trim())
      rowCount = lines.length - 1 // Subtract header row

      // Here you would typically parse and save the CSV data to leads table
      console.log(`[v0] Processing CSV with ${rowCount} leads`)
    }

    const leadList = await TelemarketingOperations.createLeadList({
      name,
      description,
      created_by: userId ? Number.parseInt(userId) : 1,
    })

    return NextResponse.json({ leadList, rowCount })
  } catch (error) {
    console.error("Error creating lead list:", error)
    return NextResponse.json({ error: "Failed to create lead list" }, { status: 500 })
  }
}
