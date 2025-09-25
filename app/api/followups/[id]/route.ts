import { NextResponse } from "next/server"
import { FollowupOperations, DatabaseError } from "@/lib/database"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: "At least one field is required" }, { status: 400 })
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const followup = await FollowupOperations.update(id, body)
    return NextResponse.json(followup)
  } catch (error) {
    console.error("Error updating followup:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to update followup" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    // For now, we'll just mark as deleted by updating status
    const followup = await FollowupOperations.updateStatus(id, "Deleted", userId)
    return NextResponse.json(followup)
  } catch (error) {
    console.error("Error deleting followup:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to delete followup" }, { status: 500 })
  }
}
