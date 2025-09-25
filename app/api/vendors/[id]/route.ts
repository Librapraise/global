import { NextResponse } from "next/server"
import { VendorOperations, DatabaseError } from "@/lib/database"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    const vendor = await VendorOperations.getById(id)
    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error fetching vendor:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch vendor" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const vendor = await VendorOperations.update(id, body, userId)
    return NextResponse.json(vendor)
  } catch (error) {
    console.error("Error updating vendor:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 })
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    await VendorOperations.delete(id, userId)
    return NextResponse.json({ message: "Vendor deleted successfully" })
  } catch (error) {
    console.error("Error deleting vendor:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 })
  }
}
