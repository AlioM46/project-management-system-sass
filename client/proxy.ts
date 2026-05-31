import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define which routes are only for guests (unauthenticated users)
const guestRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// Define which routes require authentication
const protectedRoutes = ["/dashboard", "/onboarding"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const next = request.nextUrl.searchParams.get("next");
    
    // Check if the user has an access token in their cookies
    const token = request.cookies.get("access_token")?.value;
    const isInviteResumeFlow = typeof next === "string" && next.startsWith("/accept-invite");

    // 1. If they HAVE a token, but are trying to access a guest route (like /login)
    // Redirect them to the dashboard.
    if (token && guestRoutes.some(route => pathname.startsWith(route)) && !isInviteResumeFlow) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 2. If they DO NOT have a token, but are trying to access a protected route
    // Redirect them to the login page.
    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Otherwise, let them proceed normally
    return NextResponse.next();
}

// See "Matching Paths" below to learn more
// We tell the middleware to run on everything EXCEPT API routes, static files, and images
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
