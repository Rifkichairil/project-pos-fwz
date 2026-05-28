import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/get-session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let result;
    if (session.role === "admin") {
      // Admin can see all tenants
      result = await db.query<{ id: number; slug: string; name: string; status: string; created_at: string }>(
        `SELECT id, slug, name, status, created_at::text FROM tenants ORDER BY id`
      );
    } else {
      // Non-admin can only see their own tenants
      result = await db.query<{ id: number; slug: string; name: string; status: string; created_at: string }>(
        `SELECT t.id, t.slug, t.name, t.status, t.created_at::text
         FROM tenants t
         JOIN user_tenants ut ON ut.tenant_id = t.id
         WHERE ut.user_id = $1
         ORDER BY t.id`,
        [session.userId]
      );
    }

    return NextResponse.json({
      tenants: result.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: row.status,
        createdAt: new Date(row.created_at).toLocaleDateString("id-ID"),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load tenants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as { name?: string; slug?: string };
    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (!name || !slug) {
      return NextResponse.json({ error: "Nama dan slug harus diisi" }, { status: 400 });
    }

    const result = await db.query<{ id: number }>(
      `INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id`,
      [slug, name]
    );

    // Create default settings for the new tenant
    await db.query(
      `INSERT INTO settings (tenant_id, store_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [result.rows[0].id, name]
    );

    return NextResponse.json({ success: true, id: result.rows[0].id }, { status: 201 });
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return NextResponse.json({ error: "Slug sudah digunakan" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await db.query(`UPDATE tenants SET status = 'archived', updated_at = NOW() WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }
}
