import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if user is accessing protected API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Skip auth check for login endpoint
    if (request.nextUrl.pathname === "/api/auth/login") {
      return NextResponse.next()
    }

    // For other API routes, we could add JWT token validation here
    // For now, we'll rely on client-side permission checks
    return NextResponse.next()
  }

  // Check if user is accessing dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Client-side will handle the redirect if no user is found
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}
