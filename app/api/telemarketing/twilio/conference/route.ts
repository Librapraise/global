import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Conference API: Creating conference room...")

    const { conferenceName } = await request.json()

    if (!conferenceName) {
      return NextResponse.json({ error: "Conference name is required" }, { status: 400 })
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

    // Create a conference room by making a call to it
    const conference = await client.conferences.create({
      friendlyName: conferenceName,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL || "https://admin.globaladjustersfla.com"}/api/telemarketing/twilio/status`,
      statusCallbackEvent: ["start", "end", "join", "leave"],
      statusCallbackMethod: "POST",
    })

    console.log("[v0] Conference API: Conference created:", conference.sid)

    return NextResponse.json({
      success: true,
      conferenceSid: conference.sid,
      conferenceName: conferenceName,
    })
  } catch (error) {
    console.error("[v0] Conference API: Error creating conference:", error)
    return NextResponse.json(
      { error: "Failed to create conference", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
