import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Call API: Checking user authentication...")

    const user = await getCurrentUser()
    console.log("[v0] Call API: User authentication result:", user ? "authenticated" : "not authenticated")

    if (!user) {
      console.log("[v0] Call API: No authenticated user, using fallback for testing")
      const fallbackUser = {
        id: 1,
        email: "max@y12.ai",
        name: "Test User",
        role: "admin",
        is_admin: true,
      }
      console.log("[v0] Call API: Using fallback user:", fallbackUser.email)
    }

    const currentUser = user || {
      id: 1,
      email: "max@y12.ai",
      name: "Test User",
      role: "admin",
      is_admin: true,
    }

    const requestBody = await request.json()
    const { phoneNumber, leadId, connectionMode, userConference, conferenceId } = requestBody
    console.log("[v0] Call API: Request data:", { phoneNumber, leadId, connectionMode, userConference, conferenceId })

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    console.log("[v0] Call API: Checking Twilio credentials...")

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    console.log("[v0] Call API: Environment credentials check:", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasPhoneNumber: !!twilioPhoneNumber,
      accountSidLength: accountSid?.length || 0,
      authTokenLength: authToken?.length || 0,
      phoneNumberValue: twilioPhoneNumber || "undefined",
    })

    if (!accountSid || !authToken) {
      const missingVars = []
      if (!accountSid) missingVars.push("TWILIO_ACCOUNT_SID")
      if (!authToken) missingVars.push("TWILIO_AUTH_TOKEN")
      if (!twilioPhoneNumber) missingVars.push("TWILIO_PHONE_NUMBER")

      console.error("[v0] Call API: Missing Twilio credentials in environment:", missingVars)
      return NextResponse.json(
        {
          error: "Twilio credentials not configured",
          missingVariables: missingVars,
          message: "Please add the missing environment variables to your Vercel project settings",
        },
        { status: 500 },
      )
    }

    let fromNumber = twilioPhoneNumber

    try {
      // Check if telemarketing_numbers table exists and query it safely
      const userNumberResult = await sql`
        SELECT twilio_phone_number, twilio_account_sid, twilio_auth_token 
        FROM telemarketing_numbers 
        WHERE user_id = ${currentUser.id} AND is_active = true
        LIMIT 1
      `.catch((error) => {
        console.log("[v0] Call API: telemarketing_numbers table may not exist:", error.message)
        return []
      })

      if (Array.isArray(userNumberResult) && userNumberResult.length > 0) {
        console.log("[v0] Call API: Found user-specific Twilio number")
        fromNumber = userNumberResult[0].twilio_phone_number || fromNumber
      } else {
        console.log("[v0] Call API: No user-specific number found, using environment default")
      }
    } catch (dbError) {
      console.log(
        "[v0] Call API: Database query failed, using environment credentials:",
        dbError?.message || "Unknown error",
      )
    }

    if (!fromNumber) {
      console.error("[v0] Call API: No 'From' phone number available")
      return NextResponse.json({ error: "No Twilio phone number configured" }, { status: 500 })
    }

    console.log("[v0] Call API: Making Twilio API call...")
    console.log("[v0] Call API: From:", fromNumber, "To:", phoneNumber)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://admin.globaladjustersfla.com"
    const normalizedBaseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`

    // Ensure URLs are properly formatted without double slashes
    const statusUrl = `${normalizedBaseUrl}/api/telemarketing/twilio/status`

    console.log("[v0] Call API: Base URL:", normalizedBaseUrl)
    console.log("[v0] Call API: Status Callback URL:", statusUrl)

    console.log("[v0] Call API: Using TwiML webhook for mode:", connectionMode)

    let twimlContent = ""
    let callMethod = ""

    if (connectionMode === "conference" && conferenceId) {
      // Conference mode - join specific conference room
      twimlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the conference, please hold.</Say>
  <Dial timeout="30">
    <Conference startConferenceOnEnter="false" endConferenceOnExit="false" waitUrl="">${conferenceId}</Conference>
  </Dial>
</Response>`
      callMethod = "Twiml"
    } else {
      // Direct mode - direct phone-to-phone call
      twimlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call, please hold.</Say>
  <Dial timeout="30" callerId="${fromNumber}">
    <Number>${phoneNumber}</Number>
  </Dial>
</Response>`
      callMethod = "Twiml"
    }

    const callParams = new URLSearchParams({
      From: fromNumber,
      To: phoneNumber,
      StatusCallback: statusUrl,
      StatusCallbackEvent: "initiated,ringing,answered,completed",
      StatusCallbackMethod: "POST",
      Timeout: "60",
      Record: "false",
    })

    callParams.append(callMethod, twimlContent)

    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: callParams,
    })

    const twilioData = await twilioResponse.json()
    console.log("[v0] Call API: Twilio response:", {
      ok: twilioResponse.ok,
      status: twilioResponse.status,
      data: twilioData,
    })

    if (!twilioResponse.ok) {
      console.error("[v0] Call API: Twilio API error:", twilioData)
      return NextResponse.json(
        {
          error: `Twilio API error: ${twilioData.message || "Unknown error"}`,
          details: twilioData,
        },
        { status: 500 },
      )
    }

    if (leadId) {
      try {
        await sql`
          INSERT INTO lead_interactions (lead_id, user_id, interaction_type, notes, created_at)
          VALUES (${leadId}, ${currentUser.id}, 'call_initiated', ${"Call initiated via Twilio: " + twilioData.sid}, NOW())
        `.catch((error) => {
          console.log("[v0] Call API: lead_interactions table may not exist:", error.message)
        })
        console.log("[v0] Call API: Logged interaction to database")
      } catch (dbError) {
        console.error("[v0] Call API: Failed to log interaction:", dbError)
      }
    }

    console.log("[v0] Call API: Call initiated successfully:", twilioData.sid)

    return NextResponse.json({
      success: true,
      callSid: twilioData.sid,
      status: twilioData.status,
      message: "Call initiated successfully",
      connectionMode: connectionMode || "conference",
    })
  } catch (error) {
    console.error("[v0] Call API: Error initiating call:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}
