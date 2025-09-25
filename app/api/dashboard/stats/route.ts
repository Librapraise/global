import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get vendor stats
    const [vendorStats] = await sql(`
      SELECT 
        COUNT(*) as total_vendors,
        COUNT(CASE WHEN interested = true THEN 1 END) as interested_vendors,
        COUNT(CASE WHEN licensed = true THEN 1 END) as licensed_vendors
      FROM vendors
    `)

    // Get claims stats
    const [claimStats] = await sql(`
      SELECT 
        COUNT(*) as total_claims,
        COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_claims,
        COUNT(CASE WHEN status = 'CLOSED' THEN 1 END) as closed_claims,
        SUM(claim_amount) as total_claim_amount
      FROM claims
    `)

    // Get followup stats
    const [followupStats] = await sql(`
      SELECT 
        COUNT(*) as total_followups,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_followups,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_followups
      FROM vendor_followups
    `)

    // Get recent activity
    const recentClaims = await sql(`
      SELECT claim_number, status, created_at, homeowner_name
      FROM claims 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    const recentFollowups = await sql(`
      SELECT vf.*, v.name as vendor_name
      FROM vendor_followups vf
      JOIN vendors v ON vf.vendor_id = v.id
      ORDER BY vf.created_at DESC 
      LIMIT 5
    `)

    return NextResponse.json({
      vendors: vendorStats,
      claims: claimStats,
      followups: followupStats,
      recentActivity: {
        claims: recentClaims,
        followups: recentFollowups,
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
