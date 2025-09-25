"use client"

import { useState, useEffect } from "react"

export interface User {
  id: number
  email: string
  name: string
  role: string
  is_admin: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")

    if (!userData) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    } catch (error) {
      console.error("Error parsing user data:", error)
      setUser(null)
      // Clear invalid data
      localStorage.removeItem("user")
    }

    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem("user")
    setUser(null)
  }

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  }
}
