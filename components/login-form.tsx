"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Attempting login with:", { email, password: password.length + " characters" })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      let data
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
        console.log("Login response data:", data)
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const textResponse = await response.text()
        console.error("Non-JSON response received:", textResponse)
        throw new Error("Server returned an invalid response. Please try again.")
      }

      if (response.ok) {
        // Store user session with all required fields
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          is_admin: data.user.is_admin,
          is_active: data.user.is_active,
          company_tag: data.user.company_tag || "Global",
        }

        console.log("Storing user data:", userData)
        localStorage.setItem("user", JSON.stringify(userData))

        // Verify localStorage was set
        const storedData = localStorage.getItem("user")
        console.log("Verified stored data:", storedData ? "✅ Success" : "❌ Failed")

        // Navigate to dashboard
        router.push("/dashboard")
      } else {
        console.error("Login failed:", data.message)
        setError(data.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Network error. Please check your connection and try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-2xl">
      <CardHeader className="text-center space-y-4 pb-8">
        <div className="flex justify-center">
          <img
            src="https://imagedelivery.net/evaK9kznBmXiy6yXsaBusQ/758bd470-7d38-4600-99b3-2c3ba24c9a00/public"
            alt="Referral Experts Logo"
            className="h-16 w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900"> Global Public Adjusters Admin</CardTitle>
        <CardDescription className="text-gray-600 text-sm leading-relaxed">
          Secure access to contractor network and referral management system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              required
              className="h-12 border-2 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="h-12 border-2 border-gray-300 focus:border-blue-600 focus:ring-blue-600 pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Access Admin Dashboard"}
          </Button>
        </form>

        {/* Debug info for testing */}
      </CardContent>
    </Card>
  )
}
