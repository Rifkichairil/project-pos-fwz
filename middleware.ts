import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages that don't require authentication
const publicPaths = ["/", "/404"];

// Known app routes (for 404 redirect)
const knownPaths = [
  "/",
  "/dashboard",
  "/pos",
  "/inventory",
  "/transactions",
  "/member",
  "/menu",
  "/user",
  "/tenant",
  "/settings",
  "/404",
];

// Cashier can only access these paths
const cashierPaths = ["/pos"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if the path matches any known route
  const isKnown = knownPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isKnown) {
    const url = request.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.redirect(url);
  }

  // Check authentication for protected routes
  const isPublic = publicPaths.some(
    (path) => pathname === path
  );

  if (!isPublic) {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // If user is logged in and visits login page, redirect
  if (pathname === "/") {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
