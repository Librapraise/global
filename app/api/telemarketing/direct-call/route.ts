import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const requestBody = await request.json()
    const { phoneNumber, sdp, userId } = requestBody

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json({ error: "Twilio credentials not configured" }, { status: 500 })
    }

    // Create a direct SIP call using Twilio Voice SDK
    const callParams = new URLSearchParams({
      From: twilioPhoneNumber,
      To: phoneNumber,
      // Use direct TwiML without "please hold" messages
      Twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="30" callerId="${twilioPhoneNumber}">
    <Number>${phoneNumber}</Number>
  </Dial>
</Response>`,
      StatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/telemarketing/direct-call/status`,
      StatusCallbackEvent: "initiated,ringing,answered,completed",
      Record: "false"
    })

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: callParams,
      }
    )

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", twilioData)
      return NextResponse.json(
        { error: `Twilio API error: ${twilioData.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      callSid: twilioData.sid,
      status: twilioData.status,
      message: "Direct call initiated"
    })

  } catch (error) {
    console.error("Error initiating direct call:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
