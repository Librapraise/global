import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    // Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const appSid = process.env.TWILIO_TWIML_APP_SID

    if (!accountSid || !apiKey || !apiSecret || !appSid) {
      console.error("Missing Twilio credentials:", {
        hasAccountSid: !!accountSid,
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasAppSid: !!appSid
      })
      return NextResponse.json({
        error: "Twilio Voice SDK credentials not configured"
      }, { status: 500 })
    }

    // Import Twilio JWT components
    const { AccessToken } = require('twilio').jwt
    const { VoiceGrant } = AccessToken

    // Create access token
    const identity = `user-${user?.id || 'anonymous'}`
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600 // 1 hour
    })

    // Create Voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: appSid,
      incomingAllow: false // Set to true if you want to receive calls
    })

    accessToken.addGrant(voiceGrant)

    console.log(`Generated access token for identity: ${identity}`)

    return NextResponse.json({
      token: accessToken.toJwt(),
      identity: identity
    })

  } catch (error) {
    console.error("Error generating access token:", error)
    return NextResponse.json({
      error: "Failed to generate access token"
    }, { status: 500 })
  }
}