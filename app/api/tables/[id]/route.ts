import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";

type UpdateTablePayload = {
  name?: string;
  capacity?: number;
  status?: TableStatus;
};

const allowedStatuses: TableStatus[] = ["available", "occupied", "reserved", "cleaning"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tableId = Number(id);

  if (!Number.isInteger(tableId) || tableId <= 0) {
    return NextResponse.json({ error: "Invalid table id" }, { status: 400 });
  }

  const body = (await request.json()) as UpdateTablePayload;

  const fields: string[] = [];
  const values: Array<string | number> = [];
  let index = 1;

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
    }

    fields.push(`name = $${index}`);
    values.push(name);
    index += 1;
  }

  if (body.capacity !== undefined) {
    const capacity = Number(body.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      return NextResponse.json({ error: "Invalid table capacity" }, { status: 400 });
    }

    fields.push(`capacity = $${index}`);
    values.push(Math.trunc(capacity));
    index += 1;
  }

  if (body.status !== undefined) {
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid table status" }, { status: 400 });
    }

    fields.push(`status = $${index}`);
    values.push(body.status);
    index += 1;
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  }

  fields.push(`updated_at = NOW()`);
  values.push(tableId);

  try {
    const result = await db.query<{
      id: number;
      name: string;
      capacity: number;
      status: TableStatus;
    }>(
      `
        UPDATE dining_tables
        SET ${fields.join(", ")}
        WHERE id = $${index} AND is_active = TRUE
        RETURNING id, name, capacity, status
      `,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json({ table: result.rows[0] });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Table name already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tableId = Number(id);

  if (!Number.isInteger(tableId) || tableId <= 0) {
    return NextResponse.json({ error: "Invalid table id" }, { status: 400 });
  }

  try {
    const result = await db.query(
      `
        UPDATE dining_tables
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1 AND is_active = TRUE
        RETURNING id
      `,
      [tableId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
