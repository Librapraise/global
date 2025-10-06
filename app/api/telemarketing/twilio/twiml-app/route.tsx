import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    
    const conferenceId = params.get('conferenceId')
    
    console.log('[TwiML App] POST request received')
    console.log('[TwiML App] conferenceId:', conferenceId)
    console.log('[TwiML App] All params:', Object.fromEntries(params.entries()))
    
    const VoiceResponse = twilio.twiml.VoiceResponse
    const response = new VoiceResponse()
    
    if (conferenceId) {
      console.log('[TwiML App] Connecting to conference:', conferenceId)
      
      const dial = response.dial()
      dial.conference({
        beep: false,
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
      }, conferenceId)
    } else {
      console.log('[TwiML App] No conferenceId provided')
      response.say('No conference specified.')
    }
    
    const twiml = response.toString()
    console.log('[TwiML App] Generated TwiML:', twiml)
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
    
  } catch (error) {
    console.error('[TwiML App] Error:', error)
    
    const VoiceResponse = twilio.twiml.VoiceResponse
    const response = new VoiceResponse()
    response.say('An error occurred.')
    
    return new NextResponse(response.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}

export async function GET() {
  const VoiceResponse = twilio.twiml.VoiceResponse
  const response = new VoiceResponse()
  response.say('TwiML endpoint is working.')
  
  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}