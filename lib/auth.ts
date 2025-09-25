import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: number
  email: string
  name: string
  role: string
  is_admin: boolean
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    // Check if session exists and is valid
    const sessions = await sql`
      SELECT s.user_id, u.email, u.name, u.role, u.is_admin
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} 
      AND s.expires_at > NOW()
      AND u.is_active = true
    `

    if (sessions.length === 0) {
      return null
    }

    const session = sessions[0]
    return {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      is_admin: session.is_admin,
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}
