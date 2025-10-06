import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const params = new URLSearchParams(body)
  
  const VoiceResponse = twilio.twiml.VoiceResponse
  const twiml = new VoiceResponse()

  const phoneNumber = params.get('To')

  if (phoneNumber) {
    const dial = twiml.dial({
      callerId: params.get('From') || process.env.TWILIO_PHONE_NUMBER!,
      answerOnBridge: true,
      timeout: 60
    })
    dial.number(phoneNumber)
  }

  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' }
  })
}