import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

// In-memory store for call statuses (in production, use Redis or database)
const callStatuses = new Map<string, { status: string; lastUpdated: Date }>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callSid = searchParams.get("callSid")

    if (!callSid) {
      return NextResponse.json({ error: "Call SID is required" }, { status: 400 })
    }

    console.log("[v0] Status API: Checking status for call:", callSid)

    const storedStatus = callStatuses.get(callSid)
    const status = storedStatus?.status || "in-progress"

    return NextResponse.json({
      callSid,
      status,
      message: "Call status check successful",
      lastUpdated: storedStatus?.lastUpdated || new Date(),
    })
  } catch (error) {
    console.error("[v0] Status API: Error checking call status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const duration = formData.get("CallDuration") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string

    const conferenceEvent = formData.get("StatusCallbackEvent") as string
    const conferenceName = formData.get("ConferenceName") as string
    const participantLabel = formData.get("ParticipantLabel") as string
    const conferenceSid = formData.get("ConferenceSid") as string

    console.log("[v0] Twilio status callback:", {
      callSid,
      callStatus,
      duration,
      from,
      to,
      conferenceEvent,
      conferenceName,
      participantLabel,
      conferenceSid,
    })

    if (conferenceEvent) {
      let newStatus = "in-progress"

      switch (conferenceEvent) {
        case "participant-join":
        case "join":
          newStatus = "answered"
          console.log("[v0] Call answered - participant joined conference:", conferenceName)
          // Extract call SID from conference name if needed
          if (conferenceName && conferenceName.startsWith("dialer-")) {
            const extractedCallSid = conferenceName.replace("dialer-", "")
            callStatuses.set(extractedCallSid, { status: newStatus, lastUpdated: new Date() })
            console.log("[v0] Updated status for call:", extractedCallSid, "to:", newStatus)
          }
          break
        case "participant-leave":
        case "leave":
          newStatus = "completed"
          console.log("[v0] Call ended - participant left conference:", conferenceName)
          if (conferenceName && conferenceName.startsWith("dialer-")) {
            const extractedCallSid = conferenceName.replace("dialer-", "")
            callStatuses.set(extractedCallSid, { status: newStatus, lastUpdated: new Date() })
            console.log("[v0] Updated status for call:", extractedCallSid, "to:", newStatus)
          }
          break
        case "conference-start":
        case "start":
          newStatus = "answered"
          console.log("[v0] Conference started:", conferenceName)
          break
        case "conference-end":
        case "end":
          newStatus = "completed"
          console.log("[v0] Conference ended:", conferenceName)
          break
      }

      // Store the updated status for the current call SID
      if (callSid) {
        callStatuses.set(callSid, { status: newStatus, lastUpdated: new Date() })
      }
    } else if (callStatus) {
      console.log("[v0] Call status update:", callSid, "->", callStatus)
      callStatuses.set(callSid, { status: callStatus, lastUpdated: new Date() })
    }

    try {
      await sql`
        INSERT INTO lead_interactions (lead_id, user_id, interaction_type, notes, created_at)
        SELECT 
          tl.id,
          tn.user_id,
          'call_status_update',
          ${`Call ${callSid} ${conferenceEvent ? `conference event: ${conferenceEvent}` : `status: ${callStatus}`}${duration ? `, duration: ${duration}s` : ""}`},
          NOW()
        FROM telemarketing_leads tl
        JOIN telemarketing_numbers tn ON tn.twilio_phone_number = ${from}
        WHERE tl.phone = ${to}
        LIMIT 1
      `
    } catch (dbError) {
      console.log("[v0] Database logging failed (non-critical):", dbError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Twilio status callback:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
