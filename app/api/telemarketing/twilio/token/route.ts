import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  console.log("[v0] Twilio token API called via GET")
  const url = new URL(request.url)
  const identity = url.searchParams.get("identity") || "max@y12.ai"
  return handleTokenRequest(request, { identity })
}

export async function POST(request: NextRequest) {
  console.log("[v0] Twilio token API called via POST")
  try {
    const body = await request.json()
    return handleTokenRequest(request, body)
  } catch (error) {
    console.log("[v0] Failed to parse JSON body, using defaults")
    return handleTokenRequest(request, { identity: "max@y12.ai" })
  }
}

async function handleTokenRequest(request: NextRequest, body: any = {}) {
  console.log("[v0] Twilio token API called")

  try {
    const { identity } = body
    console.log("[v0] Request identity:", identity)

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const apiKey = process.env.TWILIO_API_KEY
    const apiSecret = process.env.TWILIO_API_SECRET
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID

    console.log("[v0] Twilio environment check:", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasTwimlAppSid: !!twimlAppSid,
      accountSidLength: accountSid?.length || 0,
      authTokenLength: authToken?.length || 0,
    })

    const fallbackAccountSid = process.env.TWILIO_FALLBACK_ACCOUNT_SID
    const fallbackAuthToken = process.env.TWILIO_FALLBACK_AUTH_TOKEN

    const finalAccountSid = accountSid || fallbackAccountSid
    const finalAuthToken = authToken || fallbackAuthToken

    if (!finalAccountSid || !finalAuthToken) {
      console.error("[v0] Missing Twilio configuration even with fallbacks")
      return NextResponse.json(
        {
          error: "Missing Twilio configuration",
          message: "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required",
          missing: {
            accountSid: !finalAccountSid,
            authToken: !finalAuthToken,
          },
          setupInstructions: {
            step1: "Go to Project Settings in v0",
            step2: "Add TWILIO_ACCOUNT_SID environment variable",
            step3: "Add TWILIO_AUTH_TOKEN environment variable",
            step4: "Add TWILIO_PHONE_NUMBER environment variable",
            step5: "Optionally add TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID for custom configuration",
          },
        },
        { status: 400 },
      )
    }

    const finalApiKey = apiKey || process.env.TWILIO_FALLBACK_API_KEY
    const finalApiSecret = apiSecret || process.env.TWILIO_FALLBACK_API_SECRET
    const finalTwimlAppSid = twimlAppSid || "APa5aefc1a7a0bf3f96169eebc71e7dbe9"

    console.log("[v0] Using native JWT generation...")
    const userIdentity = identity || "max@y12.ai"
    const now = Math.floor(Date.now() / 1000)
    const exp = now + 3600

    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
    const twimlUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`

    const header = {
      typ: "JWT",
      alg: "HS256",
      cty: "twilio-fpa;v=1",
    }

    const payload = {
      iss: finalApiKey,
      sub: finalAccountSid,
      exp: exp,
      nbf: now,
      iat: now,
      jti: `${finalApiKey}-${now}`,
      grants: {
        identity: userIdentity,
        voice: {
          incoming: {
            allow: true,
          },
          outgoing: {
            application_sid: finalTwimlAppSid,
            params: {
              twiml_url: `${twimlUrl}/api/telemarketing/twilio/twiml-app`,
            },
          },
        },
      },
    }

    const base64UrlEncode = (data: string | Uint8Array) => {
      try {
        let base64: string
        if (typeof data === "string") {
          base64 = btoa(unescape(encodeURIComponent(data)))
        } else {
          base64 = btoa(String.fromCharCode(...data))
        }
        return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
      } catch (error) {
        console.error("[v0] Base64 encoding failed:", error)
        throw new Error(`Base64 encoding failed: ${error.message}`)
      }
    }

    const headerB64 = base64UrlEncode(JSON.stringify(header))
    const payloadB64 = base64UrlEncode(JSON.stringify(payload))

    const data = `${headerB64}.${payloadB64}`
    const keyData = new TextEncoder().encode(finalApiSecret)

    try {
      const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
      ])

      const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data))
      const signatureB64 = base64UrlEncode(new Uint8Array(signature))

      const token = `${headerB64}.${payloadB64}.${signatureB64}`

      console.log("[v0] Native JWT token generated successfully, length:", token.length)

      return NextResponse.json({
        token,
        identity: userIdentity,
        configuration: {
          apiKey: finalApiKey.substring(0, 10) + "...",
          twimlAppSid: finalTwimlAppSid,
          usingEnvironmentVars: !!apiKey,
          method: "native-crypto",
        },
      })
    } catch (cryptoError) {
      console.error("[v0] Native JWT generation failed:", cryptoError)
      throw new Error(`JWT generation failed: ${cryptoError.message}`)
    }
  } catch (error) {
    console.error("[v0] Error generating Twilio token:", error)
    console.error("[v0] Error details:", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace",
      name: error?.name || "Unknown error type",
      toString: error?.toString() || "Cannot convert to string",
    })

    return NextResponse.json(
      {
        error: "Failed to generate access token",
        details: error?.message || "Unknown error occurred",
        errorType: error?.name || "UnknownError",
        timestamp: new Date().toISOString(),
        debugInfo: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          requestMethod: request.method,
          userAgent: request.headers.get("user-agent"),
        },
      },
      { status: 500 },
    )
  }
}
