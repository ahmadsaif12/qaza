import { NextResponse } from "next/server"
import { auth } from "@/auth"

const protectedRoutes = ["/", "/analytics", "/qaza", "/settings"]

export const proxy = auth((request) => {
  const pathname = request.nextUrl.pathname
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (isProtected && !request.auth?.user) {
    const loginUrl = new URL("/login", request.nextUrl)
    loginUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/", "/analytics/:path*", "/qaza/:path*", "/settings/:path*"],
}
