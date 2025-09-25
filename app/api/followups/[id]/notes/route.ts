import { NextResponse } from "next/server"
import { FollowupOperations, DatabaseError } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const followupId = Number.parseInt(params.id)

    if (isNaN(followupId)) {
      return NextResponse.json({ error: "Invalid followup ID" }, { status: 400 })
    }

    const notes = await FollowupOperations.getFollowupNotes(followupId)
    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching followup notes:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch followup notes" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const followupId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(followupId)) {
      return NextResponse.json({ error: "Invalid followup ID" }, { status: 400 })
    }

    if (!body.notes || !body.vendorId) {
      return NextResponse.json({ error: "Notes and vendor ID are required" }, { status: 400 })
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const note = await FollowupOperations.addFollowupNote(
      {
        vendorId: body.vendorId,
        followupDate: body.followupDate || new Date().toISOString().split("T")[0],
        followupNumber: body.followupNumber || 1,
        notes: body.notes,
      },
      userId,
    )

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Error creating followup note:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "DUPLICATE_ENTRY" ? 409 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to create followup note" }, { status: 500 })
  }
}
