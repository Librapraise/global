import { NextResponse } from "next/server"
import { FollowupOperations, DatabaseError } from "@/lib/database"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const { status } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid followup ID" }, { status: 400 })
    }

    const validStatuses = [
      "Scheduled",
      "Completed",
      "Cancelled",
      "scheduled",
      "completed",
      "cancelled",
      "in_progress",
      "pending",
      "active",
      "inactive",
    ]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Convert to lowercase for database constraint compatibility
    const dbStatus = status.toLowerCase()

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const followup = await FollowupOperations.updateStatus(id, dbStatus, userId)
    return NextResponse.json(followup)
  } catch (error) {
    console.error("Error updating followup status:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to update followup status" }, { status: 500 })
  }
}
