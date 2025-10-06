import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const conferenceId = params.get('conferenceId') || 'default-conference'
    
    console.log("[Agent Join] Connecting agent to conference:", conferenceId)
    
    // Return TwiML to join agent to conference
    // Agent joins with startConferenceOnEnter="true" to start the conference
    // This way customer hears hold music until agent joins
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference 
      startConferenceOnEnter="true" 
      endConferenceOnExit="true" 
      beep="false">${conferenceId}</Conference>
  </Dial>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml'
      }
    })
  } catch (error) {
    console.error("[Agent Join] Error:", error)
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, there was an error connecting to the conference.</Say>
  <Hangup/>
</Response>`
    
    return new NextResponse(errorTwiml, {
      status: 500,
      headers: {
        'Content-Type': 'text/xml'
      }
    })
  }
}