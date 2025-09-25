import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// Don't initialize database connection at module level
// const sql = neon(process.env.DATABASE_URL!) // ❌ Remove this line

export async function POST(request: NextRequest) {
  try {
    // Initialize database connection inside the function
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is missing")
      return NextResponse.json(
        { message: "Database configuration error" },
        { status: 500 }
      )
    }

    const sql = neon(process.env.DATABASE_URL) // ✅ Move initialization here

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        { message: "Invalid request format" },
        { status: 400 }
      )
    }

    const { email, password } = body

    console.log("=== LOGIN ATTEMPT ===")
    console.log("Email:", email)
    console.log("Password length:", password?.length || 0)

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    // Database query with error handling
    let users
    try {
      users = await sql`
        SELECT id, name, email, password_hash, role, is_admin, is_active, company_tag
        FROM users 
        WHERE email = ${email.toLowerCase().trim()}
      `
    } catch (dbError) {
      console.error("Database query failed:", {
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
      })
      return NextResponse.json(
        { message: "Database query error" },
        { status: 500 }
      )
    }

    console.log("Users found in database:", users.length)

    if (users.length === 0) {
      console.log("❌ No user found with email:", email)
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

    const user = users[0]
    console.log("✅ User found:", { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      is_active: user.is_active 
    })

    if (!user.is_active) {
      console.log("❌ User account is inactive")
      return NextResponse.json(
        { message: "Account is inactive" },
        { status: 401 }
      )
    }

    let isValidPassword = false

    // Password validation with comprehensive error handling
    try {
      // Check if password is base64 encoded
      try {
        const decodedPassword = Buffer.from(user.password_hash, "base64").toString("utf-8")
        if (decodedPassword === password) {
          isValidPassword = true
          console.log("✅ Base64 password match")

          // Upgrade to bcrypt hash for security
          const hashedPassword = await bcrypt.hash(password, 12)
          await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${user.id}`
          console.log("🔒 Password upgraded from base64 to bcrypt")
        }
      } catch (e) {
        // Not valid base64, continue with other checks
        console.log("Not base64 encoded password")
      }

      if (!isValidPassword && user.password_hash === password) {
        // Direct match for plain text passwords
        isValidPassword = true
        console.log("✅ Plain text password match")

        // Hash the password for future use
        const hashedPassword = await bcrypt.hash(password, 12)
        await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${user.id}`
        console.log("🔒 Password hashed and updated")
      } else if (!isValidPassword && user.password_hash && user.password_hash.startsWith("$2")) {
        // Bcrypt comparison for hashed passwords
        isValidPassword = await bcrypt.compare(password, user.password_hash)
        console.log("🔒 Bcrypt comparison result:", isValidPassword)
      }
    } catch (passwordError) {
      console.error("Password validation error:", passwordError)
      return NextResponse.json(
        { message: "Authentication error" },
        { status: 500 }
      )
    }

    if (!isValidPassword) {
      console.log("❌ Password verification failed")
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      )
    }

    console.log("🎉 LOGIN SUCCESSFUL")

    // Update last login with error handling
    try {
      await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`
    } catch (updateError) {
      console.error("Failed to update last login:", updateError)
      // Don't fail the login for this
    }

    // Return user data (excluding password)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: "Login successful",
        user: userWithoutPassword,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("💥 Unexpected login error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}