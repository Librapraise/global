import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const areaCode = searchParams.get("areaCode") || "555"

    // Mock available numbers for now - in production this would call Twilio API
    const mockNumbers = [
      {
        phoneNumber: `+1${areaCode}1234567`,
        friendlyName: `(${areaCode}) 123-4567`,
        locality: "New York",
        region: "NY",
      },
      {
        phoneNumber: `+1${areaCode}2345678`,
        friendlyName: `(${areaCode}) 234-5678`,
        locality: "New York",
        region: "NY",
      },
      {
        phoneNumber: `+1${areaCode}3456789`,
        friendlyName: `(${areaCode}) 345-6789`,
        locality: "New York",
        region: "NY",
      },
    ]

    return NextResponse.json({ numbers: mockNumbers })
  } catch (error) {
    console.error("Error searching available numbers:", error)
    return NextResponse.json({ error: "Failed to search numbers" }, { status: 500 })
  }
}
