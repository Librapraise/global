import { type NextRequest, NextResponse } from "next/server"
import { VendorOperations } from "@/lib/database"

export async function GET() {
  try {
    const relations = await VendorOperations.getUserVendorRelations()
    return NextResponse.json(relations)
  } catch (error) {
    console.error("Error fetching user-vendor relations:", error)
    return NextResponse.json({ error: "Failed to fetch relations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, vendor_ids } = await request.json()

    if (!user_id || !Array.isArray(vendor_ids)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    await VendorOperations.updateUserVendorRelations(user_id, vendor_ids)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user-vendor relations:", error)
    return NextResponse.json({ error: "Failed to update relations" }, { status: 500 })
  }
}
