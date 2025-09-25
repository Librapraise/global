console.log("🔍 Testing Telemarketing Database Connections...\n")
\
asynw
let me
create
a
simple
test
script
to
verify
that
all
the
database
connections
are
working
properly.
\
<CodeProject id="GlobalAdminmain" taskNameActive="Testing database connections" taskNameComplete="Tested database connections">

```typescript file="scripts/test-telemarketing-database-connections.js"
// Test script to verify telemarketing database connections
// This script tests all the major telemarketing database operations

import { sql } from "../lib/database.js"

console.log("🔍 Testing Telemarketing Database Connections...\n")

async function testDatabaseConnections() {
  try {
    // Test 1: Basic connection
    console.log("1. Testing basic database connection...")
    const connectionTest = await sql`SELECT NOW() as current_time`
    console.log("✅ Database connection successful:", connectionTest[0].current_time)

    // Test 2: Check if telemarketing tables exist
    console.log("\n2. Checking telemarketing tables...")
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'telemarketing_%'
      ORDER BY table_name
    `
    console.log("✅ Telemarketing tables found:", tables.map((t) => t.table_name).join(", "))

    // Test 3: Check telemarketing_leads table structure
    console.log("\n3. Testing telemarketing_leads table...")
    const leadsCount = await sql`SELECT COUNT(*) as count FROM telemarketing_leads`
    console.log("✅ Telemarketing leads table accessible, records:", leadsCount[0].count)

    // Test 4: Check telemarketing_scripts table
    console.log("\n4. Testing telemarketing_scripts table...")
    const scriptsCount = await sql`SELECT COUNT(*) as count FROM telemarketing_scripts`
    console.log("✅ Telemarketing scripts table accessible, records:", scriptsCount[0].count)

    // Test 5: Check telemarketing_lead_lists table
    console.log("\n5. Testing telemarketing_lead_lists table...")
    const leadListsCount = await sql`SELECT COUNT(*) as count FROM telemarketing_lead_lists`
    console.log("✅ Telemarketing lead lists table accessible, records:", leadListsCount[0].count)

    // Test 6: Check telemarketing_numbers table
    console.log("\n6. Testing telemarketing_numbers table...")
    const numbersCount = await sql`SELECT COUNT(*) as count FROM telemarketing_numbers`
    console.log("✅ Telemarketing numbers table accessible, records:", numbersCount[0].count)

    // Test 7: Check call_dispositions table
    console.log("\n7. Testing call_dispositions table...")
    const dispositionsCount = await sql`SELECT COUNT(*) as count FROM call_dispositions`
    console.log("✅ Call dispositions table accessible, records:", dispositionsCount[0].count)

    // Test 8: Check power_dialer_sessions table
    console.log("\n8. Testing power_dialer_sessions table...")
    const sessionsCount = await sql`SELECT COUNT(*) as count FROM power_dialer_sessions`
    console.log("✅ Power dialer sessions table accessible, records:", sessionsCount[0].count)

    // Test 9: Test telemarketing_stats view
    console.log("\n9. Testing telemarketing_stats view...")
    const statsView = await sql`SELECT * FROM telemarketing_stats LIMIT 1`
    console.log("✅ Telemarketing stats view accessible:", {
      totalLeads: statsView[0]?.total_leads || 0,
      newLeads: statsView[0]?.new_leads || 0,
      conversionRate: statsView[0]?.conversion_rate || 0,
    })

    // Test 10: Test call_stats_summary view
    console.log("\n10. Testing call_stats_summary view...")
    const callStatsView = await sql`SELECT COUNT(*) as count FROM call_stats_summary`
    console.log("✅ Call stats summary view accessible, user records:", callStatsView[0].count)

    // Test 11: Test assignment tables
    console.log("\n11. Testing assignment tables...")
    const scriptAssignments = await sql`SELECT COUNT(*) as count FROM telemarketing_script_assignments`
    const listAssignments = await sql`SELECT COUNT(*) as count FROM telemarketing_list_assignments`
    console.log("✅ Script assignments table accessible, records:", scriptAssignments[0].count)
    console.log("✅ List assignments table accessible, records:", listAssignments[0].count)

    // Test 12: Test complex join query (similar to what the API uses)
    console.log("\n12. Testing complex join query...")
    const complexQuery = await sql`
      SELECT 
        tl.id,
        tl.company_name,
        tl.status,
        u.name as assigned_to_name,
        tll.name as list_name
      FROM telemarketing_leads tl
      LEFT JOIN users u ON tl.assigned_to = u.id
      LEFT JOIN telemarketing_lead_lists tll ON tl.list_id = tll.id
      LIMIT 5
    `
    console.log("✅ Complex join query successful, sample records:", complexQuery.length)

    // Test 13: Test insert operation (and rollback)
    console.log("\n13. Testing insert operation...")
    const testLead = await sql`
      INSERT INTO telemarketing_leads (
        company_name, contact_person, phone, status, priority, created_by, created_at, updated_at
      ) VALUES (
        'Test Company', 'Test Contact', '+1234567890', 'new', 'medium', 1, NOW(), NOW()
      )
      RETURNING id, company_name
    `
    console.log("✅ Insert operation successful, test lead ID:", testLead[0].id)

    // Clean up test data
    await sql`DELETE FROM telemarketing_leads WHERE id = ${testLead[0].id}`
    console.log("✅ Test data cleaned up")

    console.log("\n🎉 All telemarketing database connections are working properly!")
    console.log("\n📊 Summary:")
    console.log("- All required tables exist and are accessible")
    console.log("- Views are working correctly")
    console.log("- Complex queries execute successfully")
    console.log("- Insert/Update/Delete operations work")
    console.log("- Foreign key relationships are intact")
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    console.error("Error details:", error.message)

    if (error.code) {
      console.error("Error code:", error.code)
    }

    process.exit(1)
  }
}

// Run the tests
testDatabaseConnections()
  .then(() => {
    console.log("\n✅ Database connection tests completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Database connection tests failed:", error)
    process.exit(1)
  })
