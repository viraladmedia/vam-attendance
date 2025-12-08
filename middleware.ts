import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/lib/supabase/auth";

// Pages that require authentication
const protectedRoutes = [
  "/dashboard",
  "/dashboard/attendance",
  "/dashboard/profile",
  "/dashboard/settings",
];

// Pages that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the route is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // For protected routes, verify session
    try {
      // Get the auth cookie to verify session
      const cookieStore = request.cookies;
      const authCookie = cookieStore.get("sb-auth-token");

      if (!authCookie) {
        // No auth cookie found, redirect to login
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Auth cookie exists, allow the request
      return NextResponse.next();
    } catch (error) {
      // On error, redirect to login for safety
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthRoute) {
    // For auth routes, check if user is already authenticated
    try {
      const cookieStore = request.cookies;
      const authCookie = cookieStore.get("sb-auth-token");

      if (authCookie) {
        // User is already authenticated, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // User is not authenticated, allow access to auth pages
      return NextResponse.next();
    } catch (error) {
      // On error, allow access to auth pages
      return NextResponse.next();
    }
  }

  // For all other routes, allow access
  return NextResponse.next();
}

// Configure which routes should be processed by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
