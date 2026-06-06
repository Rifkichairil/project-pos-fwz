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

// Role-based page access (who can access which pages)
const pageAccess: Record<string, string[]> = {
  "/dashboard": ["admin", "manager"],
  "/pos": ["admin", "manager", "cashier"],
  "/inventory": ["admin", "manager"],
  "/transactions": ["admin", "manager"],
  "/member": ["admin", "manager"],
  "/menu": ["admin", "manager"],
  "/user": ["admin", "manager"],
  "/tenant": ["admin"],
  "/settings": ["admin", "manager"],
};

// API paths cashier IS allowed to access
const cashierApiPaths = [
  "/api/auth",
  "/api/pos",
  "/api/menu",
  "/api/midtrans",
  "/api/tables",
  "/api/addons",
  "/api/member",
  "/api/transactions",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals (always)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("session_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  // --- API Route restrictions ---
  if (pathname.startsWith("/api")) {
    // Unauthenticated: only allow /api/auth/login and /api/uploadthing (callback from uploadthing server)
    if (!sessionToken) {
      if (pathname === "/api/auth/login" || pathname.startsWith("/api/uploadthing")) return NextResponse.next();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cashier: restrict to allowed API paths
    if (userRole === "cashier") {
      const isAllowed = cashierApiPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
      if (!isAllowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  // --- Page Route restrictions ---

  // Check if the path matches any known route
  const isKnown = knownPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (!isKnown) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  // Check authentication for protected routes
  const isPublic = publicPaths.some((path) => pathname === path);

  if (!isPublic) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Check role-based page access (defense in depth)
    if (userRole) {
      const matchedPath = Object.keys(pageAccess).find(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
      if (matchedPath) {
        const allowedRoles = pageAccess[matchedPath];
        if (!allowedRoles.includes(userRole)) {
          // Redirect to their default page
          const fallback = userRole === "cashier" ? "/pos" : "/dashboard";
          return NextResponse.redirect(new URL(fallback, request.url));
        }
      }
    }
  }

  // If user is logged in and visits login page, redirect
  if (pathname === "/") {
    if (sessionToken) {
      const redirectTo = userRole === "cashier" ? "/pos" : "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
