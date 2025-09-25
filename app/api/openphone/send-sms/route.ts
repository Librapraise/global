import { type NextRequest, NextResponse } from "next/server"

const OPENPHONE_API_KEY = "aja2Ty9MHQKeTBmLaYyape8RRbYhm5rM"
const OPENPHONE_API_URL = "https://api.openphone.com/v1/messages"
const OPENPHONE_PHONE_NUMBERS_URL = "https://api.openphone.com/v1/phone-numbers"

function formatPhoneToE164(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")

  // If it's a 10-digit US number, add +1 prefix
  if (digits.length === 10) {
    return `+1${digits}`
  }

  // If it's an 11-digit number starting with 1, add + prefix
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`
  }

  // If it already starts with +, return as is
  if (phone.startsWith("+")) {
    return phone
  }

  // Default: assume US number and add +1
  return `+1${digits}`
}

async function getOpenPhoneNumbers() {
  try {
    const response = await fetch(OPENPHONE_PHONE_NUMBERS_URL, {
      method: "GET",
      headers: {
        Authorization: OPENPHONE_API_KEY,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch OpenPhone numbers:", await response.text())
      return null
    }

    const data = await response.json()
    console.log("[v0] Available OpenPhone numbers:", data)
    return data
  } catch (error) {
    console.error("[v0] Error fetching OpenPhone numbers:", error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { to, text, from } = await request.json()

    if (!to || !text) {
      return NextResponse.json({ error: "Phone number and message text are required" }, { status: 400 })
    }

    const formattedTo = Array.isArray(to) ? to.map((phone) => formatPhoneToE164(phone)) : [formatPhoneToE164(to)]

    const phoneNumbers = await getOpenPhoneNumbers()

    let senderPhoneId = null
    let senderPhone = "+17868087407" // Default fallback

    if (phoneNumbers && phoneNumbers.data && phoneNumbers.data.length > 0) {
      // Find the phone number that matches 786-808-7407
      const targetPhone = phoneNumbers.data.find(
        (phone: any) => phone.phoneNumber === "+17868087407" || phone.phoneNumber === "17868087407",
      )

      if (targetPhone) {
        senderPhoneId = targetPhone.id
        senderPhone = targetPhone.phoneNumber
        console.log("[v0] Found matching phone number:", { id: senderPhoneId, number: senderPhone })
      } else {
        // Use the first available phone number if target not found
        senderPhoneId = phoneNumbers.data[0].id
        senderPhone = phoneNumbers.data[0].phoneNumber
        console.log("[v0] Using first available phone number:", { id: senderPhoneId, number: senderPhone })
      }
    }

    console.log("[v0] Sending SMS via OpenPhone:", {
      from: senderPhoneId || senderPhone,
      to: formattedTo,
      content: text.substring(0, 50) + "...",
    })

    const requestBody = {
      content: text,
      to: formattedTo,
      ...(senderPhoneId ? { from: senderPhoneId } : { from: senderPhone }),
    }

    const response = await fetch(OPENPHONE_API_URL, {
      method: "POST",
      headers: {
        Authorization: OPENPHONE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[v0] OpenPhone API error:", errorData)

      if (errorData.includes("Phone number not found")) {
        return NextResponse.json(
          {
            error:
              "No valid phone numbers found in your OpenPhone account. Please add and verify a phone number in your OpenPhone dashboard first.",
          },
          { status: 404 },
        )
      }

      return NextResponse.json({ error: "Failed to send SMS via OpenPhone" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] SMS sent successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in OpenPhone SMS API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
