import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] TwiML App: Handling Voice SDK connection request")

    // Parse the form data from Twilio
    const formData = await request.formData()
    const conferenceId = formData.get("conferenceId") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const action = formData.get("action") as string

    console.log("[v0] TwiML App: Parameters:", { conferenceId, phoneNumber, action })

    let twiml = ""

    if (action === "join-conference" && conferenceId) {
      // Browser joining conference - create conference room
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Joining conference, please wait for the other party.</Say>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="true" waitUrl="">${conferenceId}</Conference>
  </Dial>
</Response>`
    } else {
      // Default conference mode
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="false" waitUrl="">default-conference</Conference>
  </Dial>
</Response>`
    }

    console.log("[v0] TwiML App: Generated TwiML:", twiml)

    // Return TwiML response with proper content type
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("[v0] TwiML App: Error generating TwiML:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference startConferenceOnEnter="true" endConferenceOnExit="false" waitUrl="">error-conference</Conference>
  </Dial>
</Response>`

    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    })
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return new NextResponse("TwiML App OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  })
}
