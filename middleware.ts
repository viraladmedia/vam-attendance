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

  if (isProtectedRoute) {
    // For protected routes, verify session
    // Supabase SSR uses multiple cookies for auth, check for any of them
    const cookieStore = request.cookies;
    
    // Supabase sets cookies like: sb-[project-ref]-auth-token, sb-[project-ref]-auth-token-code-verifier, etc
    const hasAuthCookie = cookieStore
      .getAll()
      .some((cookie) => cookie.name.includes("auth"));

    if (!hasAuthCookie) {
      // No auth cookie found, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Auth cookie exists, allow the request
    return NextResponse.next();
  }

  // For all other routes, allow access (including auth routes)
  // This prevents redirect loops on login/signup pages
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
