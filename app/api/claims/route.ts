import { NextResponse } from "next/server"
import { ClaimsOperations, DatabaseError } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined
    const source = searchParams.get("source") || undefined
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

    const result = await ClaimsOperations.getAll({
      page,
      limit,
      search,
      status,
      source,
      sortBy,
      sortOrder,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching claims:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.claim_number) {
      return NextResponse.json({ error: "Claim number is required" }, { status: 400 })
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const claim = await ClaimsOperations.create(body, userId)
    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error("Error creating claim:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "DUPLICATE_ENTRY" ? 409 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 })
  }
}
