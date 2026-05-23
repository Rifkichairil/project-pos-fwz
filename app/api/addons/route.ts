import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type AddonRow = {
  id: number;
  name: string;
  price: string;
  is_active: boolean;
};

export async function GET() {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const result = await db.query<AddonRow>(
      `SELECT id, name, price::text, is_active FROM addons WHERE is_active = TRUE AND tenant_id = $1 ORDER BY name`,
      [tenant.context.tenantId]
    );

    return NextResponse.json({
      addons: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load addons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; price?: number | string };
    const name = body.name?.trim();
    const price = Number(body.price) || 0;

    if (!name) {
      return NextResponse.json({ error: "Nama addon harus diisi" }, { status: 400 });
    }

    const result = await db.query<{ id: number }>(
      `INSERT INTO addons (name, price) VALUES ($1, $2) RETURNING id`,
      [name, price]
    );

    return NextResponse.json({ success: true, addon: { id: result.rows[0].id, name, price } }, { status: 201 });
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return NextResponse.json({ error: "Addon sudah ada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create addon" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await db.query(`UPDATE addons SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete addon" }, { status: 500 });
  }
}
