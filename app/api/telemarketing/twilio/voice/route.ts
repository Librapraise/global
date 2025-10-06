// app/api/telemarketing/twilio/voice/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Twilio voice endpoint called via GET")
  const url = new URL(request.url)
  const conferenceId = url.searchParams.get('conferenceId')
  return handleVoiceRequest(conferenceId)
}

export async function POST(request: NextRequest) {
  console.log("[v0] Twilio voice endpoint called via POST")
  
  try {
    const contentType = request.headers.get('content-type') || ''
    let conferenceId = null

    if (contentType.includes('application/json')) {
      const body = await request.json()
      conferenceId = body.conferenceId
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      conferenceId = formData.get('conferenceId') as string
    } else {
      // Try to parse as form data anyway
      try {
        const formData = await request.formData()
        conferenceId = formData.get('conferenceId') as string
      } catch (e) {
        console.log("[v0] Could not parse form data, checking URL params")
        const url = new URL(request.url)
        conferenceId = url.searchParams.get('conferenceId')
      }
    }

    console.log("[v0] Conference ID from request:", conferenceId)
    return handleVoiceRequest(conferenceId)
    
  } catch (error) {
    console.error("[v0] Error parsing voice request:", error)
    // Fallback: try URL params
    const url = new URL(request.url)
    const conferenceId = url.searchParams.get('conferenceId')
    return handleVoiceRequest(conferenceId)
  }
}

function handleVoiceRequest(conferenceId: string | null) {
  console.log("[v0] Generating TwiML for conference:", conferenceId)

  if (!conferenceId) {
    console.error("[v0] No conference ID provided")
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Conference ID not provided. Please try again.</Say>
  <Hangup/>
</Response>`
    
    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
      status: 400,
    })
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Conference 
      startConferenceOnEnter="true" 
      endConferenceOnExit="true"
      waitUrl=""
      beep="false">${conferenceId}</Conference>
  </Dial>
</Response>`

  console.log("[v0] TwiML generated for agent browser connection")
  
  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}