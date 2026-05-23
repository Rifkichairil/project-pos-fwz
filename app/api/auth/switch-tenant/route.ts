import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/get-session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { tenantId?: number };
    const tenantId = Number(body.tenantId);

    if (!Number.isFinite(tenantId) || tenantId <= 0) {
      return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    // Verify tenant exists and is active
    const tenantResult = await db.query<{ id: number }>(
      `SELECT id FROM tenants WHERE id = $1 AND status = 'active'`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Admin can switch to any tenant; non-admin must belong to the tenant
    if (session.role !== "admin") {
      const membershipResult = await db.query<{ tenant_id: number }>(
        `SELECT tenant_id FROM user_tenants WHERE user_id = $1 AND tenant_id = $2`,
        [session.userId, tenantId]
      );

      if (membershipResult.rows.length === 0) {
        return NextResponse.json({ error: "Access denied to this tenant" }, { status: 403 });
      }
    }

    // Update session's active_tenant_id
    await db.query(
      `UPDATE auth_sessions SET active_tenant_id = $1, updated_at = NOW() WHERE user_id = $2 AND expires_at > NOW()`,
      [tenantId, session.userId]
    );

    return NextResponse.json({ success: true, tenantId });
  } catch {
    return NextResponse.json({ error: "Failed to switch tenant" }, { status: 500 });
  }
}
