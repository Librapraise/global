import { NextResponse } from "next/server"
import { VendorOperations, DatabaseError } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "100") // Increased default limit from 20 to 100
    const search = searchParams.get("search") || undefined
    const location = searchParams.get("location") || undefined
    const tradeType = searchParams.get("tradeType") || undefined
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc"

    const userId = searchParams.get("userId") || undefined
    const userRole = searchParams.get("userRole") || undefined
    const isAdmin = searchParams.get("isAdmin") === "true"
    const representative = searchParams.get("representative") || undefined

    console.log("[v0] Vendor API - Access control parameters:", {
      isAdmin,
      representative,
      userId,
      userRole,
      limit,
      page,
    })

    const result = await VendorOperations.getAll({
      page,
      limit,
      search,
      location,
      tradeType,
      sortBy,
      sortOrder,
      userId,
      userRole,
      isAdmin,
      representative,
    })

    console.log("[v0] Vendor API - Query result:", {
      totalVendors: result.data.length,
      totalFromDB: result.pagination.total,
      isAdmin,
      representative,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching vendors:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // TODO: Get actual user ID from session/JWT
    const userId = 1 // Placeholder

    const vendor = await VendorOperations.create(body, userId)
    return NextResponse.json(vendor, { status: 201 })
  } catch (error) {
    console.error("Error creating vendor:", error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "DUPLICATE_ENTRY" ? 409 : 400 },
      )
    }

    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 })
  }
}
