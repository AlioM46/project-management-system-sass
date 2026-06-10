import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const guestRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const protectedRoutes = ["/dashboard", "/onboarding"];
const adminOrOwnerRoutes = ["/dashboard/admin"];

async function verifyAdminOrOwner(token: string, workspaceId: string): Promise<boolean> {
    try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

        const [meRes, membersRes] = await Promise.all([
            fetch(`${apiBaseUrl}/auth/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }),
            fetch(`${apiBaseUrl}/workspaces/members`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "X-Workspace-Id": workspaceId
                }
            })
        ]);

        if (!meRes.ok || !membersRes.ok) {
            return false;
        }

        const meData = await meRes.json();
        const membersData = await membersRes.json();

        const user = meData.data.user || meData;
        const members = membersData.data.members || [];



        const currentMember = members.find((m: any) => m.user_id === user.id);
        const roleSlug = currentMember?.role?.slug;


        return roleSlug === "owner" || roleSlug === "admin";
    } catch (error) {
        console.error("Middleware authorization check failed:", error);
        return false;
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const next = request.nextUrl.searchParams.get("next");
    const token = request.cookies.get("access_token")?.value;
    const workspaceId = request.cookies.get("workspace_id")?.value;
    const isInviteResumeFlow = typeof next === "string" && next.startsWith("/accept-invite");

    if (token && guestRoutes.some((route) => pathname.startsWith(route)) && !isInviteResumeFlow) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Middleware-level route guard for admin pages
    if (adminOrOwnerRoutes.some((route) => pathname.startsWith(route))) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        if (!workspaceId) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        const isAuthorized = await verifyAdminOrOwner(token, workspaceId);
        if (!isAuthorized) {
            // Redirect unauthorized users to dashboard
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
