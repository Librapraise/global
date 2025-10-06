// /app/api/telemarketing/twilio/debug-credentials/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasApiKey: !!process.env.TWILIO_API_KEY,
    hasApiSecret: !!process.env.TWILIO_API_SECRET,
    hasTwimlAppSid: !!process.env.TWILIO_TWIML_APP_SID,
    accountSidPrefix: process.env.TWILIO_ACCOUNT_SID?.substring(0, 4),
    apiKeyPrefix: process.env.TWILIO_API_KEY?.substring(0, 4),
    twimlAppSidPrefix: process.env.TWILIO_TWIML_APP_SID?.substring(0, 4),
  })
}   