import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const priority = searchParams.get("priority") || ""
    const listId = searchParams.get("listId") || ""

    const offset = (page - 1) * limit

    let dataQuery = `
      SELECT 
        tl.*,
        u.name as assigned_to_name,
        tll.name as lead_list_name
      FROM telemarketing_leads tl
      LEFT JOIN users u ON tl.assigned_to = u.id
      LEFT JOIN telemarketing_lead_lists tll ON tl.list_id = tll.id
    `

    let countQuery = `
      SELECT COUNT(*) as count
      FROM telemarketing_leads tl
    `

    const whereConditions = []
    const queryParams: any[] = []

    if (search) {
      whereConditions.push(
        `(tl.company_name ILIKE $${queryParams.length + 1} OR tl.contact_person ILIKE $${queryParams.length + 2})`,
      )
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (status) {
      whereConditions.push(`tl.status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }

    if (priority) {
      whereConditions.push(`tl.priority = $${queryParams.length + 1}`)
      queryParams.push(priority)
    }

    if (listId) {
      whereConditions.push(`tl.list_id = $${queryParams.length + 1}`)
      queryParams.push(Number(listId))
    }

    if (whereConditions.length > 0) {
      const whereClause = " WHERE " + whereConditions.join(" AND ")
      dataQuery += whereClause
      countQuery += whereClause
    }

    dataQuery += ` ORDER BY tl.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`
    queryParams.push(limit, offset)

    const countParams = queryParams.slice(0, -2) // Remove limit and offset for count query

    const leads = await sql.query(dataQuery, queryParams)
    const countResult = await sql.query(countQuery, countParams)
    const count = countResult[0]?.count || 0

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching telemarketing leads:", error)
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company_name,
      contact_person,
      phone,
      email,
      address,
      industry,
      lead_source,
      priority = "medium",
      notes,
      created_by,
      leads, // For bulk CSV import
    } = body

    // Handle bulk CSV import
    if (leads && Array.isArray(leads)) {
      const insertedLeads = []

      for (const lead of leads) {
        const [insertedLead] = await sql`
          INSERT INTO telemarketing_leads (
            company_name, contact_person, phone, email, address, industry,
            lead_source, status, priority, notes, created_by, created_at, updated_at
          ) VALUES (
            ${lead.company_name}, ${lead.contact_person}, ${lead.phone}, ${lead.email},
            ${lead.address}, ${lead.industry}, ${lead.lead_source || "csv_import"},
            'new', ${lead.priority || "medium"}, ${lead.notes}, ${created_by},
            NOW(), NOW()
          )
          RETURNING *
        `
        insertedLeads.push(insertedLead)
      }

      return NextResponse.json(
        {
          message: `Successfully imported ${insertedLeads.length} leads`,
          leads: insertedLeads,
        },
        { status: 201 },
      )
    }

    // Handle single lead creation
    if (!company_name) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const [lead] = await sql`
      INSERT INTO telemarketing_leads (
        company_name, contact_person, phone, email, address, industry,
        lead_source, status, priority, notes, created_by, created_at, updated_at
      ) VALUES (
        ${company_name}, ${contact_person}, ${phone}, ${email}, ${address}, ${industry},
        ${lead_source}, 'new', ${priority}, ${notes}, ${created_by}, NOW(), NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error("Error creating telemarketing lead:", error)
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 })
  }
}
