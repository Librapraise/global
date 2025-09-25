import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { has_access } = body

    if (typeof has_access !== "boolean") {
      return NextResponse.json({ error: "has_access must be a boolean" }, { status: 400 })
    }

    if (has_access) {
      const availableNumbers = await sql`
        SELECT id, phone_number, friendly_name 
        FROM telemarketing_numbers 
        WHERE assigned_user_id IS NULL AND is_active = true
        LIMIT 1
      `

      if (availableNumbers.length === 0) {
        return NextResponse.json({ error: "No available telemarketing numbers" }, { status: 400 })
      }

      const numberId = availableNumbers[0].id

      // Assign the number to the user
      await sql`
        UPDATE users 
        SET telemarketing_number_id = ${numberId}, updated_at = NOW()
        WHERE id = ${params.id}
      `

      // Mark the number as assigned
      await sql`
        UPDATE telemarketing_numbers 
        SET assigned_user_id = ${params.id}, updated_at = NOW()
        WHERE id = ${numberId}
      `
    } else {
      const user = await sql`
        SELECT telemarketing_number_id FROM users WHERE id = ${params.id}
      `

      if (user.length > 0 && user[0].telemarketing_number_id) {
        // Unassign the number
        await sql`
          UPDATE telemarketing_numbers 
          SET assigned_user_id = NULL, updated_at = NOW()
          WHERE id = ${user[0].telemarketing_number_id}
        `
      }

      // Remove number from user
      await sql`
        UPDATE users 
        SET telemarketing_number_id = NULL, updated_at = NOW()
        WHERE id = ${params.id}
      `
    }

    const result = await sql`
      SELECT u.id, u.name, u.email, u.telemarketing_number_id,
             tn.phone_number as assigned_number, tn.friendly_name as number_caller_id
      FROM users u
      LEFT JOIN telemarketing_numbers tn ON u.telemarketing_number_id = tn.id
      WHERE u.id = ${params.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        ...result[0],
        telemarketing_access: result[0].telemarketing_number_id ? true : false,
      },
      message: `Telemarketing access ${has_access ? "granted" : "removed"} successfully`,
    })
  } catch (error) {
    console.error("Error updating telemarketing access:", error)
    return NextResponse.json(
      {
        error: "Failed to update telemarketing access",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await sql`
      SELECT u.id, u.name, u.email, u.telemarketing_number_id,
             tn.phone_number as assigned_number, tn.friendly_name as number_caller_id
      FROM users u
      LEFT JOIN telemarketing_numbers tn ON u.telemarketing_number_id = tn.id
      WHERE u.id = ${params.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        ...result[0],
        telemarketing_access: result[0].telemarketing_number_id ? true : false,
        telemarketing_script_id: null, // Will be implemented later
        telemarketing_lead_list_ids: [], // Will be implemented later
      },
      has_telemarketing_access: result[0].telemarketing_number_id ? true : false,
    })
  } catch (error) {
    console.error("Error fetching telemarketing access:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch telemarketing access",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
