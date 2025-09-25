import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[v0] Fetching telemarketing stats from database")

    // Get basic lead statistics
    const leadStatsResult = await sql`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN status = 'interested' THEN 1 END) as interested_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        COUNT(CASE WHEN last_contacted::date = CURRENT_DATE THEN 1 END) as contacted_today
      FROM telemarketing_leads
    `

    // Get call statistics for today
    const callStatsResult = await sql`
      SELECT 
        COUNT(cl.*) as total_calls_today,
        COUNT(CASE WHEN cd.disposition IN ('Contact Made', 'Appointment Set', 'Sale Made') THEN 1 END) as successful_calls_today,
        COALESCE(AVG(cl.duration), 0) as avg_call_duration_today
      FROM call_logs cl
      LEFT JOIN call_dispositions cd ON cl.lead_id = cd.lead_id AND cl.user_id = cd.user_id
      WHERE DATE(cl.created_at) = CURRENT_DATE
    `

    // Get active users count (users who made calls today)
    const activeUsersResult = await sql`
      SELECT COUNT(DISTINCT user_id) as active_users
      FROM call_logs 
      WHERE DATE(created_at) = CURRENT_DATE
    `

    // Get telemarketing numbers count
    const twilioNumbersResult = await sql`
      SELECT COUNT(*) as active_numbers
      FROM telemarketing_numbers 
      WHERE is_active = true
    `

    // Get conversion rate
    const conversionResult = await sql`
      SELECT 
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
        COUNT(*) as total,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END)::decimal / COUNT(*)) * 100, 2)
          ELSE 0 
        END as conversion_rate
      FROM telemarketing_leads
      WHERE status != 'new'
    `

    const leadStats = leadStatsResult[0] || {}
    const callStats = callStatsResult[0] || {}
    const activeUsers = activeUsersResult[0] || {}
    const twilioNumbers = twilioNumbersResult[0] || {}
    const conversion = conversionResult[0] || {}

    const stats = {
      // Lead statistics
      totalLeads: Number.parseInt(leadStats.total_leads) || 0,
      newLeads: Number.parseInt(leadStats.new_leads) || 0,
      contactedLeads: Number.parseInt(leadStats.contacted_leads) || 0,
      interestedLeads: Number.parseInt(leadStats.interested_leads) || 0,
      convertedLeads: Number.parseInt(leadStats.converted_leads) || 0,
      contactedToday: Number.parseInt(leadStats.contacted_today) || 0,
      conversionRate: Number.parseFloat(conversion.conversion_rate) || 0,

      // Call statistics
      totalCallsToday: Number.parseInt(callStats.total_calls_today) || 0,
      successfulCallsToday: Number.parseInt(callStats.successful_calls_today) || 0,
      avgCallDurationToday: Math.round(Number.parseFloat(callStats.avg_call_duration_today) || 0),

      // User statistics
      activeUsers: Number.parseInt(activeUsers.active_users) || 0,

      // System status
      twilioStatus: Number.parseInt(twilioNumbers.active_numbers) > 0 ? "active" : "inactive",
      activeNumbers: Number.parseInt(twilioNumbers.active_numbers) || 0,

      // Calculated metrics
      callSuccessRate:
        Number.parseInt(callStats.total_calls_today) > 0
          ? Math.round(
              (Number.parseInt(callStats.successful_calls_today) / Number.parseInt(callStats.total_calls_today)) * 100,
            )
          : 0,
    }

    console.log("[v0] Stats calculated successfully:", stats)
    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching telemarketing stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats", details: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()

    if (action === "refresh") {
      // Trigger a refresh of materialized views or cached statistics
      // This could be useful for real-time dashboard updates

      // For now, just return success - in a production environment,
      // you might refresh materialized views or clear caches here
      return NextResponse.json({ success: true, message: "Stats refreshed" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating telemarketing stats:", error)
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 })
  }
}
