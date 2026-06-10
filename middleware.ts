// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─── JWT verify inlined here because middleware runs in Edge Runtime
// and cannot import from @/lib/* or use Node.js modules ─────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-secret"
);

interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "STAFF";
  name: string;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Route config ─────────────────────────────────────────────────────────

const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

const ADMIN_ONLY_PAGE_ROUTES = ["/users", "/audit-logs"];

const ADMIN_ONLY_API_ROUTES = ["/api/users", "/api/audit-logs"];

// ─── Middleware ────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Allow public auth routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  // No token → redirect to login (or 401 for API routes)
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifyToken(token);

  // Invalid/expired token → clear cookie and redirect
  if (!session) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete("auth_token");
      return res;
    }
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("auth_token");
    return res;
  }

  // Admin-only page routes
  if (ADMIN_ONLY_PAGE_ROUTES.some((r) => pathname.startsWith(r))) {
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Admin-only API routes
  if (ADMIN_ONLY_API_ROUTES.some((r) => pathname.startsWith(r))) {
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Attach user context to request headers so API routes don't re-verify JWT
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-user-role", session.role);
  requestHeaders.set("x-user-name", session.name);
  requestHeaders.set("x-user-email", session.email);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on all routes except static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|images/).*)",
  ],
};
