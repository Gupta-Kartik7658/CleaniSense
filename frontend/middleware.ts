import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("cleanisense_token")?.value;
  const { pathname } = request.nextUrl;

  // Define paths that require authentication
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/complaints") ||
    pathname.startsWith("/hotspots") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  // Redirect to login if accessing protected path without token
  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if logged-in user hits login page
  if (pathname === "/login" && token) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
