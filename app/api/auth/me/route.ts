import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await db.query<{ fullname: string; email: string; role: string; active_tenant_id: number | null; tenant_name: string | null }>(
      `SELECT u.fullname, u.email, u.role, s.active_tenant_id, t.name AS tenant_name
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN tenants t ON t.id = s.active_tenant_id
       WHERE s.session_token = $1 AND s.expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      name: user.fullname,
      email: user.email,
      role: user.role,
      tenantId: user.active_tenant_id,
      tenantName: user.tenant_name,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
