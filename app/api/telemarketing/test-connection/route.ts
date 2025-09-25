import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection and telemarketing tables
    const tests = []

    // Test 1: Basic connection
    try {
      const connectionTest = await sql`SELECT NOW() as current_time`
      tests.push({
        name: "Database Connection",
        status: "success",
        details: `Connected at ${connectionTest[0].current_time}`,
      })
    } catch (error) {
      tests.push({
        name: "Database Connection",
        status: "error",
        details: error.message,
      })
    }

    // Test 2: Telemarketing tables
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'telemarketing_%'
        ORDER BY table_name
      `
      tests.push({
        name: "Telemarketing Tables",
        status: "success",
        details: `Found ${tables.length} tables: ${tables.map((t) => t.table_name).join(", ")}`,
      })
    } catch (error) {
      tests.push({
        name: "Telemarketing Tables",
        status: "error",
        details: error.message,
      })
    }

    // Test 3: Data counts
    try {
      const leadsCount = await sql`SELECT COUNT(*) as count FROM telemarketing_leads`
      const scriptsCount = await sql`SELECT COUNT(*) as count FROM telemarketing_scripts`
      const listsCount = await sql`SELECT COUNT(*) as count FROM telemarketing_lead_lists`

      tests.push({
        name: "Data Counts",
        status: "success",
        details: `Leads: ${leadsCount[0].count}, Scripts: ${scriptsCount[0].count}, Lists: ${listsCount[0].count}`,
      })
    } catch (error) {
      tests.push({
        name: "Data Counts",
        status: "error",
        details: error.message,
      })
    }

    // Test 4: Views
    try {
      const statsView = await sql`SELECT * FROM telemarketing_stats LIMIT 1`
      tests.push({
        name: "Telemarketing Stats View",
        status: "success",
        details: `Total leads: ${statsView[0]?.total_leads || 0}, Conversion rate: ${statsView[0]?.conversion_rate || 0}%`,
      })
    } catch (error) {
      tests.push({
        name: "Telemarketing Stats View",
        status: "error",
        details: error.message,
      })
    }

    // Test 5: Complex join query
    try {
      const joinQuery = await sql`
        SELECT 
          tl.id,
          tl.company_name,
          u.name as assigned_to_name,
          tll.name as list_name
        FROM telemarketing_leads tl
        LEFT JOIN users u ON tl.assigned_to = u.id
        LEFT JOIN telemarketing_lead_lists tll ON tl.list_id = tll.id
        LIMIT 3
      `
      tests.push({
        name: "Complex Join Query",
        status: "success",
        details: `Retrieved ${joinQuery.length} records with joins`,
      })
    } catch (error) {
      tests.push({
        name: "Complex Join Query",
        status: "error",
        details: error.message,
      })
    }

    const successCount = tests.filter((t) => t.status === "success").length
    const totalTests = tests.length

    return NextResponse.json({
      success: successCount === totalTests,
      summary: `${successCount}/${totalTests} tests passed`,
      tests,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing telemarketing database connections:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test database connections",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
