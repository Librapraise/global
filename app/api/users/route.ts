import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""

    const offset = (page - 1) * limit

    let users
    let total

    if (search && role) {
      users = await sql`
        SELECT u.id, u.name, u.email, u.role, u.is_admin, u.is_active, u.company_tag, 
               u.created_at, u.updated_at, u.last_login, u.telemarketing_number_id,
               tn.phone_number as assigned_number, tn.friendly_name as number_caller_id
        FROM users u
        LEFT JOIN telemarketing_numbers tn ON u.telemarketing_number_id = tn.id
        WHERE (u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`})
          AND u.role = ${role}
        ORDER BY u.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      const [{ count }] = await sql`
        SELECT COUNT(*) as count FROM users 
        WHERE (name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})
          AND role = ${role}
      `
      total = count
    } else if (search) {
      users = await sql`
        SELECT u.id, u.name, u.email, u.role, u.is_admin, u.is_active, u.company_tag, 
               u.created_at, u.updated_at, u.last_login, u.telemarketing_number_id,
               tn.phone_number as assigned_number, tn.friendly_name as number_caller_id
        FROM users u
        LEFT JOIN telemarketing_numbers tn ON u.telemarketing_number_id = tn.id
        WHERE u.name ILIKE ${`%${search}%`} OR u.email ILIKE ${`%${search}%`}
        ORDER BY u.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      const [{ count }] = await sql`
        SELECT COUNT(*) as count FROM users 
        WHERE name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`}
      `
      total = count
    } else if (role) {
      users = await sql`
        SELECT u.id, u.name, u.email, u.role, u.is_admin, u.is_active, u.company_tag, 
               u.created_at, u.updated_at, u.last_login, u.telemarketing_number_id,
               tn.phone_number as assigned_number, tn.friendly_name as number_caller_id
        FROM users u
        LEFT JOIN telemarketing_numbers tn ON u.telemarketing_number_id = tn.id
        WHERE u.role = ${role}
        ORDER BY u.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      const [{ count }] = await sql`
        SELECT COUNT(*) as count FROM users WHERE role = ${role}
      `
      total = count
    } else {
      users = await sql`
        SELECT u.id, u.name, u.email, u.role, u.is_admin, u.is_active, u.company_tag, 
               u.created_at, u.updated_at, u.last_login, u.telemarketing_number_id,
               tn.phone_number as assigned_number, tn.friendly_name as number_caller_id
        FROM users u
        LEFT JOIN telemarketing_numbers tn ON u.telemarketing_number_id = tn.id
        ORDER BY u.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      const [{ count }] = await sql`SELECT COUNT(*) as count FROM users`
      total = count
    }

    const transformedUsers = users.map((user) => ({
      ...user,
      telemarketing_access: user.telemarketing_number_id ? true : false,
      telemarketing_script_id: null, // Will be implemented later
      telemarketing_lead_list_ids: [], // Will be implemented later
    }))

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, company_tag, is_admin = false } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, role, company_tag, is_admin, is_active, created_at, updated_at)
      VALUES (${name}, ${email}, ${hashedPassword}, ${role}, ${company_tag}, ${is_admin}, true, NOW(), NOW())
      RETURNING id, name, email, role, is_admin, is_active, company_tag, created_at
    `

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
