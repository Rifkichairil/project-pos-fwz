import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type RefundItemPayload = {
  orderCode: string;
  itemName: string;
  itemIndex: number;
};

export async function POST(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  const client = await db.connect();

  try {
    const body = (await request.json()) as RefundItemPayload;

    if (!body.orderCode || !body.itemName) {
      return NextResponse.json({ error: "Invalid refund payload" }, { status: 400 });
    }

    await client.query("BEGIN");

    // Find the order
    const orderResult = await client.query<{ id: number; total_amount: string; status: string }>(
      `SELECT id, total_amount::text, status FROM sales_orders WHERE order_code = $1 LIMIT 1`,
      [body.orderCode]
    );

    const order = orderResult.rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Find the specific item (by name and index offset)
    const itemsResult = await client.query<{ id: number; menu_name_snapshot: string; line_total: string; note: string | null }>(
      `SELECT id, menu_name_snapshot, line_total::text, note FROM sales_order_items WHERE sales_order_id = $1 ORDER BY id`,
      [order.id]
    );

    const items = itemsResult.rows;
    const targetItem = items[body.itemIndex];

    if (!targetItem || targetItem.menu_name_snapshot !== body.itemName) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Item not found in order" }, { status: 404 });
    }

    // Check if already refunded
    if (targetItem.note && targetItem.note.includes("[REFUNDED]")) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Item already refunded" }, { status: 400 });
    }

    const refundAmount = Number(targetItem.line_total);

    // Mark item as refunded by appending to note
    const newNote = targetItem.note ? `${targetItem.note} [REFUNDED]` : "[REFUNDED]";
    await client.query(
      `UPDATE sales_order_items SET note = $1, updated_at = NOW() WHERE id = $2`,
      [newNote, targetItem.id]
    );

    // Update order total
    const newTotal = Math.max(0, Number(order.total_amount) - refundAmount);
    await client.query(
      `UPDATE sales_orders SET total_amount = $1, updated_at = NOW() WHERE id = $2`,
      [newTotal, order.id]
    );

    // Record in status history
    await client.query(
      `INSERT INTO order_status_history (sales_order_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $2, 'POS Cashier', $3)`,
      [order.id, order.status, `refund_item:${body.itemName}:${refundAmount}`]
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true, refundAmount, newTotal });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  } finally {
    client.release();
  }
}
