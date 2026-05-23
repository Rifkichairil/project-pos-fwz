import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

type TableRow = {
  id: number;
  name: string;
  capacity: number;
  status: TableStatus;
};

type CreateTablePayload = {
  name?: string;
  capacity?: number;
  status?: TableStatus;
};

const allowedStatuses: TableStatus[] = ["available", "occupied", "reserved", "cleaning"];

export async function GET() {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const result = await db.query<TableRow>(
      `
        SELECT id, name, capacity, status
        FROM dining_tables
        WHERE is_active = TRUE AND tenant_id = $1
        ORDER BY id
      `,
      [tenant.context.tenantId]
    );

    return NextResponse.json({ tables: result.rows });
  } catch {
    return NextResponse.json({ error: "Failed to load tables" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateTablePayload;

  const name = body.name?.trim();
  const capacity = Number(body.capacity);
  const status = (body.status || "available") as TableStatus;

  if (!name || !Number.isFinite(capacity) || capacity <= 0 || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const result = await db.query<TableRow>(
      `
        INSERT INTO dining_tables (name, capacity, status)
        VALUES ($1, $2, $3)
        RETURNING id, name, capacity, status
      `,
      [name, Math.trunc(capacity), status]
    );

    return NextResponse.json({ table: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Table name already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}
