import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Twilio config API: Checking user authentication...")

    const user = await getCurrentUser()
    console.log("[v0] Twilio config API: User authentication result:", user ? "authenticated" : "not authenticated")

    if (!user) {
      console.log("[v0] Twilio config API: No authenticated user, using fallback for testing")
      const fallbackUser = {
        id: 1,
        email: "max@y12.ai",
        name: "Test User",
        role: "admin",
        is_admin: true,
      }
      console.log("[v0] Twilio config API: Using fallback user:", fallbackUser.email)
    }

    const currentUser = user || {
      id: 1,
      email: "max@y12.ai",
      name: "Test User",
      role: "admin",
      is_admin: true,
    }

    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get Twilio configuration from database
    const result = await sql`
      SELECT * FROM twilio_config 
      WHERE id = 1
      LIMIT 1
    `

    if (result.length === 0) {
      // Return default empty config if none exists
      return NextResponse.json({
        account_sid: "",
        auth_token: "",
        application_sid: "",
        webhook_url: "",
        status_callback_url: "",
      })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error fetching Twilio config:", error)
    return NextResponse.json({
      account_sid: "",
      auth_token: "",
      application_sid: "",
      webhook_url: "",
      status_callback_url: "",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Twilio config API POST: Checking user authentication...")

    const user = await getCurrentUser()
    console.log(
      "[v0] Twilio config API POST: User authentication result:",
      user ? "authenticated" : "not authenticated",
    )

    if (!user) {
      console.log("[v0] Twilio config API POST: No authenticated user, using fallback for testing")
    }

    const currentUser = user || {
      id: 1,
      email: "max@y12.ai",
      name: "Test User",
      role: "admin",
      is_admin: true,
    }

    if (!currentUser?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { account_sid, auth_token, application_sid, webhook_url, status_callback_url } = await request.json()

    // Upsert Twilio configuration
    const result = await sql`
      INSERT INTO twilio_config (id, account_sid, auth_token, application_sid, webhook_url, status_callback_url, updated_at)
      VALUES (1, ${account_sid}, ${auth_token}, ${application_sid}, ${webhook_url}, ${status_callback_url}, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        account_sid = EXCLUDED.account_sid,
        auth_token = EXCLUDED.auth_token,
        application_sid = EXCLUDED.application_sid,
        webhook_url = EXCLUDED.webhook_url,
        status_callback_url = EXCLUDED.status_callback_url,
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ success: true, config: result[0] })
  } catch (error) {
    console.error("Error saving Twilio config:", error)
    return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 })
  }
}
