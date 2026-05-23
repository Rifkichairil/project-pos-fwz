import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password harus diisi" }, { status: 400 });
    }

    const result = await db.query<{ id: number; fullname: string; email: string; role: string; active_tenant_id: number | null; password: string }>(
      `SELECT id, fullname, email, role, active_tenant_id, password FROM users WHERE (username = $1 OR email = $1) AND is_active = TRUE LIMIT 1`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const user = result.rows[0];

    // Compare password (support both hashed and plain text for migration)
    const isValid = user.password.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!isValid) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get tenant (admin can login without tenant, but we try to assign one)
    let tenantId = user.active_tenant_id;
    if (!tenantId) {
      const tenantResult = await db.query<{ tenant_id: number }>(
        `SELECT tenant_id FROM user_tenants WHERE user_id = $1 AND is_default = TRUE LIMIT 1`,
        [user.id]
      );
      tenantId = tenantResult.rows[0]?.tenant_id || null;
    }

    // For admin without user_tenants, assign the first active tenant
    if (!tenantId && user.role === "admin") {
      const firstTenant = await db.query<{ id: number }>(
        `SELECT id FROM tenants WHERE status = 'active' ORDER BY id LIMIT 1`
      );
      tenantId = firstTenant.rows[0]?.id || null;
    }

    if (!tenantId && user.role !== "admin") {
      return NextResponse.json({ error: "User tidak memiliki tenant" }, { status: 403 });
    }

    // Save session
    await db.query(
      `INSERT INTO auth_sessions (session_token, user_id, active_tenant_id, expires_at, updated_at) VALUES ($1, $2, $3, $4, NOW())`,
      [sessionToken, user.id, tenantId, expiresAt.toISOString()]
    );

    // Set cookie via response header
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.fullname, email: user.email, role: user.role },
    });

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login gagal" }, { status: 500 });
  }
}
