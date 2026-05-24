import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/get-session";

type UserRow = {
  id: number;
  fullname: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  tenant_name: string | null;
};

type UserTenantRow = {
  user_id: number;
  tenant_id: number;
  tenant_name: string;
  role: string;
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let result;
    if (session.role === "admin") {
      // Admin can see all users
      result = await db.query<UserRow>(
        `SELECT u.id, u.fullname, u.username, u.email, u.phone, u.role, u.is_active, u.created_at::text,
                t.name AS tenant_name
         FROM users u
         LEFT JOIN tenants t ON t.id = u.active_tenant_id
         WHERE u.is_active = TRUE
         ORDER BY u.id`
      );
    } else {
      // Non-admin can only see users in their tenant
      result = await db.query<UserRow>(
        `SELECT u.id, u.fullname, u.username, u.email, u.phone, u.role, u.is_active, u.created_at::text,
                t.name AS tenant_name
         FROM users u
         LEFT JOIN tenants t ON t.id = u.active_tenant_id
         WHERE u.is_active = TRUE AND u.active_tenant_id = $1
         ORDER BY u.id`,
        [session.tenantId]
      );
    }

    // Fetch user-tenant assignments for all users
    const userIds = result.rows.map((r) => r.id);
    let userTenantsMap: Record<number, { tenantId: number; tenantName: string; role: string }[]> = {};
    if (userIds.length > 0) {
      const utResult = await db.query<UserTenantRow>(
        `SELECT ut.user_id, ut.tenant_id, t.name AS tenant_name, ut.role
         FROM user_tenants ut
         JOIN tenants t ON t.id = ut.tenant_id
         WHERE ut.user_id = ANY($1)
         ORDER BY ut.user_id, t.name`,
        [userIds]
      );
      for (const row of utResult.rows) {
        if (!userTenantsMap[row.user_id]) userTenantsMap[row.user_id] = [];
        userTenantsMap[row.user_id].push({ tenantId: row.tenant_id, tenantName: row.tenant_name, role: row.role });
      }
    }

    return NextResponse.json({
      users: result.rows.map((row) => ({
        id: row.id,
        name: row.fullname,
        username: row.username,
        email: row.email,
        phone: row.phone || "-",
        role: row.role,
        tenant: row.tenant_name || "-",
        tenants: userTenantsMap[row.id] || [],
        createdAt: new Date(row.created_at).toLocaleDateString("id-ID"),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await db.connect();

  try {
    const body = (await request.json()) as {
      name?: string;
      username?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: string;
      tenantId?: string | number;
    };

    const name = body.name?.trim();
    const username = body.username?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim() || null;
    const password = body.password || "";
    const role = ["admin", "manager", "cashier"].includes(body.role || "") ? body.role : "cashier";
    let tenantId = Number(body.tenantId) || null;

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // Non-admin users auto-assign to their own tenant
    if (session.role !== "admin") {
      tenantId = session.tenantId;
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant harus dipilih" }, { status: 400 });
    }

    // Non-admin cannot create admin users
    if (session.role !== "admin" && role === "admin") {
      return NextResponse.json({ error: "Tidak memiliki izin membuat admin" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query("BEGIN");

    const result = await client.query<{ id: number }>(
      `INSERT INTO users (fullname, username, email, phone, password, role, active_tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, username, email, phone, hashedPassword, role, tenantId]
    );

    await client.query(
      `INSERT INTO user_tenants (user_id, tenant_id, role, is_default) VALUES ($1, $2, $3, TRUE) ON CONFLICT (user_id, tenant_id) DO NOTHING`,
      [result.rows[0].id, tenantId, role]
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true, id: result.rows[0].id }, { status: 201 });
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return NextResponse.json({ error: "Email atau username sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can assign tenants
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang dapat assign tenant" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      userId?: number;
      tenantId?: number;
      role?: string;
      action?: "assign" | "remove";
    };

    const userId = Number(body.userId);
    const tenantId = Number(body.tenantId);
    const role = ["admin", "manager", "cashier"].includes(body.role || "") ? body.role : "manager";
    const action = body.action || "assign";

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "userId dan tenantId wajib diisi" }, { status: 400 });
    }

    // Verify user exists
    const userResult = await db.query<{ id: number }>(
      `SELECT id FROM users WHERE id = $1 AND is_active = TRUE`, [userId]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Verify tenant exists and is active
    const tenantResult = await db.query<{ id: number }>(
      `SELECT id FROM tenants WHERE id = $1 AND status = 'active'`, [tenantId]
    );
    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 });
    }

    if (action === "assign") {
      await db.query(
        `INSERT INTO user_tenants (user_id, tenant_id, role, is_default)
         VALUES ($1, $2, $3, FALSE)
         ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = $3`,
        [userId, tenantId, role]
      );
      return NextResponse.json({ success: true, message: "Tenant berhasil di-assign" });
    } else {
      // Remove tenant assignment
      // Don't allow removing the last tenant
      const countResult = await db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM user_tenants WHERE user_id = $1`, [userId]
      );
      if (Number(countResult.rows[0].count) <= 1) {
        return NextResponse.json({ error: "User harus memiliki minimal 1 tenant" }, { status: 400 });
      }

      await db.query(
        `DELETE FROM user_tenants WHERE user_id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      );

      // If the removed tenant was the active one, switch to another
      const activeResult = await db.query<{ active_tenant_id: number | null }>(
        `SELECT active_tenant_id FROM users WHERE id = $1`, [userId]
      );
      if (activeResult.rows[0]?.active_tenant_id === tenantId) {
        const newDefault = await db.query<{ tenant_id: number }>(
          `SELECT tenant_id FROM user_tenants WHERE user_id = $1 LIMIT 1`, [userId]
        );
        if (newDefault.rows[0]) {
          await db.query(
            `UPDATE users SET active_tenant_id = $1, updated_at = NOW() WHERE id = $2`,
            [newDefault.rows[0].tenant_id, userId]
          );
        }
      }

      return NextResponse.json({ success: true, message: "Tenant berhasil di-remove" });
    }
  } catch {
    return NextResponse.json({ error: "Failed to update tenant assignment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.query(`UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
