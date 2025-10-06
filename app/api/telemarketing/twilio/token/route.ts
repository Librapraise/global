import { type NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

async function generateToken(identity?: string, conferenceId?: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const apiKey = process.env.TWILIO_API_KEY
  const apiSecret = process.env.TWILIO_API_SECRET
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

  console.log("[Token] Credentials check:", {
    hasAccountSid: !!accountSid,
    hasApiKey: !!apiKey,
    hasApiSecret: !!apiSecret,
    hasTwimlAppSid: !!twimlAppSid,
    conferenceId: conferenceId, // Log the conferenceId
  })

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    throw new Error("Missing required Twilio credentials")
  }

  const userIdentity = identity || `agent-${Date.now()}`
  
  // Create access token using Twilio SDK
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: userIdentity,
    ttl: 3600,
  })

  // Create voice grant with custom parameters
  const voiceGrantOptions: any = {
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  }

  // CRITICAL: Add conferenceId to outgoing application parameters
  if (conferenceId) {
    voiceGrantOptions.outgoingApplicationParams = {
      conferenceId: conferenceId
    }
    console.log("[Token] Adding conferenceId to grant:", conferenceId)
  }

  const voiceGrant = new VoiceGrant(voiceGrantOptions)
  token.addGrant(voiceGrant)

  console.log("[Token] Generated successfully for:", userIdentity, "with conferenceId:", conferenceId)

  return {
    token: token.toJwt(),
    identity: userIdentity,
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {}
    
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      console.log("[Token] No JSON body, using defaults")
    }
    
    const { identity, conferenceId } = body
    const result = await generateToken(identity, conferenceId)
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error("[Token] Error:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate token",
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const identity = url.searchParams.get("identity") || undefined
    const conferenceId = url.searchParams.get("conferenceId") || undefined
    
    const result = await generateToken(identity, conferenceId)
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error("[Token] Error:", error)
    return NextResponse.json(
      { 
        error: "Failed to generate token",
        details: error.message 
      },
      { status: 500 }
    )
  }
}