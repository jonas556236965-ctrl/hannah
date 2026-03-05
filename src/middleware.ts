import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that don't require authentication
const publicRoutes = ["/login", "/api/webhook/leads", "/api/auth"]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow public routes and static files
    if (
        publicRoutes.some(route => pathname.startsWith(route)) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon")
    ) {
        return NextResponse.next()
    }

    const session = await auth()

    if (!session?.user) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
