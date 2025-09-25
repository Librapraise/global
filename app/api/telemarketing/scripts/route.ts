import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get("listId")

    let scripts
    if (listId) {
      scripts = await sql`
        SELECT s.*, u.name as created_by_name
        FROM telemarketing_scripts s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.list_id = ${listId}
        ORDER BY s.created_at DESC
      `
    } else {
      scripts = await sql`
        SELECT s.*, u.name as created_by_name
        FROM telemarketing_scripts s
        LEFT JOIN users u ON s.created_by = u.id
        ORDER BY s.created_at DESC
      `
    }

    const formattedScripts = scripts.map((script) => ({
      id: script.id,
      name: script.name,
      content: script.content,
      created_by: script.created_by_name || "Unknown",
      created_at: script.created_at,
      updated_at: script.updated_at,
    }))

    return NextResponse.json(formattedScripts)
  } catch (error) {
    console.error("Error fetching scripts:", error)
    return NextResponse.json({ error: "Failed to fetch scripts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, content, listId, userId } = await request.json()

    if (!name || !content || !listId) {
      return NextResponse.json({ error: "Name, content, and listId are required" }, { status: 400 })
    }

    // Use provided userId or default to 1
    const createdBy = userId || 1

    const script = await sql`
      INSERT INTO telemarketing_scripts (name, content, created_by, list_id, created_at, updated_at)
      VALUES (${name}, ${content}, ${createdBy}, ${listId}, NOW(), NOW())
      RETURNING *
    `

    return NextResponse.json({ script: script[0] })
  } catch (error) {
    console.error("Error creating script:", error)
    return NextResponse.json({ error: "Failed to create script" }, { status: 500 })
  }
}
