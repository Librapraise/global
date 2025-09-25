import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const userId = searchParams.get("user_id")
    const action = searchParams.get("action")
    const resourceType = searchParams.get("resource_type")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    const offset = (page - 1) * limit

    // Build WHERE conditions
    const conditions = []
    const params: any[] = []
    let paramIndex = 1

    if (userId) {
      conditions.push(`al.user_id = $${paramIndex}`)
      params.push(Number.parseInt(userId))
      paramIndex++
    }

    if (action) {
      conditions.push(`al.action = $${paramIndex}`)
      params.push(action)
      paramIndex++
    }

    if (resourceType) {
      conditions.push(`al.resource_type = $${paramIndex}`)
      params.push(resourceType)
      paramIndex++
    }

    if (startDate) {
      conditions.push(`al.created_at >= $${paramIndex}`)
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      conditions.push(`al.created_at <= $${paramIndex}`)
      params.push(endDate)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `

    const countResult = await sql.unsafe(countQuery, params)
    const total = countResult[0]?.total || 0

    // Get audit logs with user information
    const logsQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const logs = await sql.unsafe(logsQuery, [...params, limit, offset])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
