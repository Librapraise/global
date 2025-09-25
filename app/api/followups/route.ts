import { NextResponse } from "next/server"
import { FollowupOperations, DatabaseError } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || undefined
    const vendorId = searchParams.get("vendorId") ? Number.parseInt(searchParams.get("vendorId")!) : undefined
    const sortBy = searchParams.get("sortBy") || "follow_up_date"
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

    const userId = searchParams.get("userId") || undefined
    const userRole = searchParams.get("userRole") || undefined
    const isAdmin = searchParams.get("isAdmin") === "true"
    const representative = searchParams.get("representative") || undefined

    const result = await FollowupOperations.getAll({
      page,
      limit,
      status,
      vendorId,
      sortBy,
      sortOrder,
      userId,
      userRole,
      isAdmin,
      representative,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching followups:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch followups" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.vendor_id || !body.follow_up_date) {
      return NextResponse.json({ error: "Vendor ID and follow-up date are required" }, { status: 400 })
    }

    console.log("[v0] Creating followup with data:", {
      vendor_id: body.vendor_id,
      follow_up_date: body.follow_up_date,
      follow_up_time: body.follow_up_time,
      meeting_type: body.meeting_type,
      organizer: body.organizer,
      address: body.address,
      notes: body.notes,
      status: body.status,
      created_by: body.created_by,
    })

    const followupData = {
      ...body,
      organizer: body.organizer || "System",
      meeting_type: body.meeting_type || "Phone Call",
      address: body.address || "",
      notes: body.notes || "",
      status: body.status || "scheduled",
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const followup = await FollowupOperations.create(followupData, userId)

    console.log("[v0] Successfully created followup:", followup.id)

    return NextResponse.json(followup, { status: 201 })
  } catch (error) {
    console.error("Error creating followup:", error)

    if (error instanceof Error) {
      console.error("[v0] Detailed error:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "FOREIGN_KEY_VIOLATION" ? 400 : 500 },
      )
    }

    return NextResponse.json({ error: "Failed to create followup" }, { status: 500 })
  }
}
