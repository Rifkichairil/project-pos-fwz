import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type UserRow = {
  id: number;
  fullname: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

export async function GET() {
  try {
    const result = await db.query<UserRow>(
      `SELECT id, fullname, username, email, phone, role, is_active, created_at::text FROM users WHERE is_active = TRUE ORDER BY id`
    );

    return NextResponse.json({
      users: result.rows.map((row) => ({
        id: row.id,
        name: row.fullname,
        username: row.username,
        email: row.email,
        phone: row.phone || "-",
        role: row.role,
        createdAt: new Date(row.created_at).toLocaleDateString("id-ID"),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      username?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: string;
    };

    const name = body.name?.trim();
    const username = body.username?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim() || null;
    const password = body.password || "";
    const role = ["admin", "manager", "cashier"].includes(body.role || "") ? body.role : "cashier";

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    const result = await db.query<{ id: number }>(
      `INSERT INTO users (fullname, username, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, username, email, phone, password, role]
    );

    return NextResponse.json({ success: true, id: result.rows[0].id }, { status: 201 });
  } catch (err) {
    const pgErr = err as { code?: string };
    if (pgErr.code === "23505") {
      return NextResponse.json({ error: "Email atau username sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
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
