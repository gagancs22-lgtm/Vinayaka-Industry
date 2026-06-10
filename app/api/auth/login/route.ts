// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

// ─── Dev fallback user (used when DATABASE_URL is not configured) ─────────────
const DEV_USER = {
  id: "dev-admin-001",
  name: "Admin",
  email: "admin@example.com",
  // bcrypt hash of "Admin@123"
  password: "$2a$10$E2YEw21K1BT1vTUz3DZNseYsI8kgFNt9BndtCnBZtlsf/O8ZWJUCy",
  role: "ADMIN" as const,
  status: "ACTIVE",
};

function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.length > 0 && !url.includes("<user>") && !url.includes("<password>");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  let user: typeof DEV_USER | null = null;

  if (isDbConfigured()) {
    // Production path: query real database
    try {
      const { prisma } = await import("@/lib/db");
      const dbUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (dbUser && dbUser.status !== "INACTIVE") {
        user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          password: dbUser.password,
          role: dbUser.role as "ADMIN",
          status: dbUser.status,
        };
      }
    } catch (err) {
      console.error("DB error during login:", err);
      return NextResponse.json({ error: "Database error. Check your DATABASE_URL in .env." }, { status: 500 });
    }
  } else {
    // Dev path: use hardcoded admin credentials
    if (email.toLowerCase() === DEV_USER.email) {
      user = DEV_USER;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  // Update lastLogin only when DB is live
  if (isDbConfigured()) {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    } catch {
      // non-fatal
    }
  }

  const response = NextResponse.json({
    data: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
