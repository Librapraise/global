import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        u.created_at,
        u.last_login,
        tn.phone_number,
        COALESCE(call_stats.total_calls, 0) as total_calls,
        COALESCE(call_stats.successful_calls, 0) as successful_calls,
        CASE 
          WHEN COALESCE(call_stats.total_calls, 0) > 0 
          THEN ROUND((COALESCE(call_stats.successful_calls, 0)::numeric / call_stats.total_calls::numeric) * 100, 1)
          ELSE 0 
        END as conversion_rate
      FROM users u
      LEFT JOIN telemarketing_numbers tn ON u.id = tn.assigned_user_id AND tn.is_active = true
      LEFT JOIN (
        SELECT 
          created_by as user_id,
          COUNT(*) as total_calls,
          COUNT(CASE WHEN outcome = 'successful' THEN 1 END) as successful_calls
        FROM lead_interactions
        WHERE interaction_type = 'call'
        GROUP BY created_by
      ) call_stats ON u.id = call_stats.user_id
      WHERE u.role IN ('user', 'manager', 'admin') OR u.telemarketing_number_id IS NOT NULL
      ORDER BY u.name
    `

    // Format the response to match the expected interface
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      assigned_scripts: [], // Will be populated separately if needed
      assigned_lists: [], // Will be populated separately if needed
      call_stats: {
        total_calls: user.total_calls,
        successful_calls: user.successful_calls,
        conversion_rate: user.conversion_rate,
      },
      is_active: user.is_active,
      last_active: user.last_login,
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Error fetching telemarketing users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
