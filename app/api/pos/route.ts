import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type PosOrderItemPayload = {
  menuId?: number;
  name: string;
  variant?: string;
  sugar?: string;
  price: number;
  qty: number;
  note?: string;
};

type PosOrderPayload = {
  orderCode: string;
  customerName: string;
  memberName?: string;
  orderType: string;
  tableNumber: string;
  cashierName: string;
  paymentMethod: "cash" | "qris" | "card" | "midtrans" | "e_wallet" | "transfer";
  paymentStatus: "pending" | "paid";
  provider?: string;
  providerTxId?: string;
  subtotal: number;
  discount: number;
  taxes: number;
  pb1Amount?: number;
  serviceAmount: number;
  ppnAmount?: number;
  total: number;
  items: PosOrderItemPayload[];
};

type KanbanStatus = "Queue" | "Process" | "Ready" | "Served" | "Done";

type PosOrderBoardRow = {
  order_code: string;
  status: "draft" | "open" | "paid" | "cancelled" | "refunded";
  order_at: string;
  total_amount: string;
  notes: string | null;
  cashier_name: string;
  items_count: number;
  menu_items: Array<{ name: string; qty: number; price: number; variant?: string; sugar?: string; note?: string }>;
  kanban_note: string | null;
  kanban_changed_at: string | null;
};

type PosOrderStatusPatchPayload = {
  orderCode: string;
  status?: KanbanStatus;
  paymentStatus?: "pending" | "paid" | "failed" | "voided" | "refunded";
  handledBy?: string;
};

const toKanbanStatus = (status: PosOrderBoardRow["status"], kanbanNote: string | null): KanbanStatus => {
  if (kanbanNote && kanbanNote.startsWith("kanban:")) {
    const mapped = kanbanNote.slice(7) as KanbanStatus;
    if (mapped === "Queue" || mapped === "Process" || mapped === "Ready" || mapped === "Served" || mapped === "Done") {
      return mapped;
    }
  }

  if (status === "cancelled" || status === "refunded") return "Done";
  if (status === "paid") return "Served";
  return "Queue";
};

const toDbStatus = (status: KanbanStatus): "open" | "paid" | "cancelled" | "refunded" => {
  if (status === "Served" || status === "Done") return "paid";
  return "open";
};

const parseOrderMeta = (notes: string | null) => {
  if (!notes) return { orderType: "Takeaway", customerName: "Guest", tableName: "" };

  const type = notes.match(/order_type=([^;]+)/)?.[1]?.trim();
  const customer = notes.match(/customer=([^;]+)/)?.[1]?.trim();
  const table = notes.match(/table=([^;]+)/)?.[1]?.trim();

  return {
    orderType: type ? type.charAt(0).toUpperCase() + type.slice(1) : "Takeaway",
    customerName: customer || "Guest",
    tableName: table || "",
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") || "30");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 30;
  const period = (searchParams.get("period") || "today").toLowerCase();
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  let dateCondition = "so.order_at::date = CURRENT_DATE";
  const params: Array<number | string> = [limit];

  if (period === "weekly") {
    dateCondition = "so.order_at >= date_trunc('week', NOW()) AND so.order_at < date_trunc('week', NOW()) + INTERVAL '1 week'";
  } else if (period === "monthly") {
    dateCondition = "so.order_at >= date_trunc('month', NOW()) AND so.order_at < date_trunc('month', NOW()) + INTERVAL '1 month'";
  } else if (period === "custom" && startDate && endDate) {
    params.push(startDate, endDate);
    dateCondition = "so.order_at >= $2::date AND so.order_at < ($3::date + INTERVAL '1 day')";
  }

  try {
    const result = await db.query<PosOrderBoardRow>(
      `
        SELECT
          so.order_code,
          so.status,
          so.order_at::text,
          so.total_amount::text,
          so.notes,
          so.cashier_name,
          COALESCE(items.items_count, 0)::int AS items_count,
          COALESCE(items.menu_items, '[]'::json) AS menu_items,
          kanban.kanban_note,
          kanban.kanban_changed_at::text
        FROM sales_orders so
        LEFT JOIN LATERAL (
          SELECT
            COALESCE(SUM(soi.qty), 0) AS items_count,
            COALESCE(
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'name', soi.menu_name_snapshot,
                  'qty', soi.qty,
                  'price', soi.unit_price,
                  'variant', soi.variant_name,
                  'sugar', soi.sugar_level,
                  'note', soi.note
                )
                ORDER BY soi.id
              ),
              '[]'::json
            ) AS menu_items
          FROM sales_order_items soi
          WHERE soi.sales_order_id = so.id
        ) items ON TRUE
        LEFT JOIN LATERAL (
          SELECT osh.note AS kanban_note, osh.changed_at AS kanban_changed_at
          FROM order_status_history osh
          WHERE osh.sales_order_id = so.id
            AND osh.note LIKE 'kanban:%'
          ORDER BY osh.changed_at DESC, osh.id DESC
          LIMIT 1
        ) kanban ON TRUE
        WHERE ${dateCondition}
        ORDER BY so.order_at DESC
        LIMIT $1
      `,
      params
    );

    const orders = result.rows.map((row) => {
      const meta = parseOrderMeta(row.notes);
      const kanbanStatus = toKanbanStatus(row.status, row.kanban_note);

      return {
        id: row.order_code,
        orderCode: row.order_code,
        name: meta.customerName,
        type: meta.orderType,
        tableName: meta.tableName,
        status: kanbanStatus,
        time: new Date(row.order_at).toLocaleString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).replace(",", ""),
        items: Number(row.items_count),
        total: Number(row.total_amount),
        handledBy: row.cashier_name,
        menuItems: (row.menu_items || []).map((item) => ({
          name: item.name,
          qty: Number(item.qty),
          price: Number(item.price),
          variant: item.variant,
          sugar: item.sugar,
          note: item.note ? item.note.replace(" [REFUNDED]", "").replace("[REFUNDED]", "") : item.note,
          refunded: !!(item.note && item.note.includes("[REFUNDED]")),
        })),
      };
    });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Failed to load POS orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const client = await db.connect();

  try {
    const body = (await request.json()) as PosOrderStatusPatchPayload;

    if (!body.orderCode) {
      return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
    }

    await client.query("BEGIN");

    const existing = await client.query<{ id: number; status: "draft" | "open" | "paid" | "cancelled" | "refunded" }>(
      `SELECT id, status FROM sales_orders WHERE order_code = $1 LIMIT 1`,
      [body.orderCode]
    );

    const row = existing.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (body.status) {
      if (!["Queue", "Process", "Ready", "Served", "Done"].includes(body.status)) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Invalid kanban status" }, { status: 400 });
      }

      const nextStatus = toDbStatus(body.status);

      await client.query(
        `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
        [nextStatus, row.id]
      );

      await client.query(
        `
          INSERT INTO order_status_history (
            sales_order_id,
            from_status,
            to_status,
            changed_by,
            note
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        [row.id, row.status, nextStatus, "POS Board", `kanban:${body.status}`]
      );

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    }

    if (!body.paymentStatus || !["pending", "paid", "failed", "voided", "refunded"].includes(body.paymentStatus)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    }

    await client.query(
      `
        UPDATE order_payments
        SET status = $1,
            paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END,
            updated_at = NOW()
        WHERE id = (
          SELECT id
          FROM order_payments
          WHERE sales_order_id = $2
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        )
      `,
      [body.paymentStatus, row.id]
    );

    const nextOrderStatus = body.paymentStatus === "paid" ? "paid" : body.paymentStatus === "pending" ? "open" : row.status;

    await client.query(
      `UPDATE sales_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [nextOrderStatus, row.id]
    );

    await client.query(
      `
        INSERT INTO order_status_history (
          sales_order_id,
          from_status,
          to_status,
          changed_by,
          note
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      [row.id, row.status, nextOrderStatus, body.handledBy || "POS Cashier", `payment:${body.paymentStatus}`]
    );

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const client = await db.connect();

  try {
    const body = (await request.json()) as PosOrderPayload;

    if (!body.orderCode || !body.customerName || !body.orderType || !body.tableNumber || !body.cashierName) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0 || body.total <= 0) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 });
    }

    await client.query("BEGIN");

    let memberId: number | null = null;
    if (body.memberName) {
      const memberResult = await client.query<{ id: number }>(
        `SELECT id FROM members WHERE name = $1 AND is_active = TRUE ORDER BY id LIMIT 1`,
        [body.memberName]
      );
      memberId = memberResult.rows[0]?.id ?? null;
    }

    const orderStatus = body.paymentStatus === "paid" ? "paid" : "open";

    const orderResult = await client.query<{ id: number }>(
      `
        INSERT INTO sales_orders (
          order_code,
          member_id,
          order_at,
          cashier_name,
          status,
          subtotal,
          discount_amount,
          tax_amount,
          service_amount,
          pb1_amount,
          service_charge_amount,
          ppn_amount,
          total_amount,
          notes
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `,
      [
        body.orderCode,
        memberId,
        body.cashierName,
        orderStatus,
        body.subtotal,
        body.discount,
        body.taxes,
        body.serviceAmount,
        body.pb1Amount || 0,
        body.serviceAmount || 0,
        body.ppnAmount || 0,
        body.total,
        `order_type=${body.orderType}; table=${body.tableNumber}; customer=${body.customerName}`,
      ]
    );

    const salesOrderId = orderResult.rows[0].id;

    const menuMapResult = await client.query<{ id: number; name: string }>(
      `SELECT id, name FROM menus WHERE is_active = TRUE`
    );
    const menuMap = new Map(menuMapResult.rows.map((row) => [row.name.toLowerCase(), row.id]));

    for (const item of body.items) {
      const resolvedMenuId = item.menuId && item.menuId > 0 ? item.menuId : menuMap.get(item.name.toLowerCase()) || null;
      const lineTotal = item.price * item.qty;

      await client.query(
        `
          INSERT INTO sales_order_items (
            sales_order_id,
            menu_id,
            menu_name_snapshot,
            variant_name,
            sugar_level,
            note,
            qty,
            unit_price,
            line_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          salesOrderId,
          resolvedMenuId,
          item.name,
          item.variant || null,
          item.sugar || null,
          item.note || null,
          item.qty,
          item.price,
          lineTotal,
        ]
      );
    }

    const paymentMethod = body.paymentMethod === "midtrans" ? "qris" : body.paymentMethod;
    const paymentProvider = body.paymentMethod === "midtrans" ? "midtrans" : body.provider || null;

    await client.query(
      `
        INSERT INTO order_payments (
          sales_order_id,
          method,
          amount,
          provider,
          provider_tx_id,
          status,
          paid_at,
          raw_payload
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        salesOrderId,
        paymentMethod,
        body.total,
        paymentProvider,
        body.providerTxId || body.orderCode,
        body.paymentStatus,
        body.paymentStatus === "paid" ? new Date().toISOString() : null,
        JSON.stringify({ orderType: body.orderType, tableNumber: body.tableNumber, customerName: body.customerName }),
      ]
    );

    await client.query(
      `
        INSERT INTO order_status_history (
          sales_order_id,
          from_status,
          to_status,
          changed_by,
          note
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      [salesOrderId, null, orderStatus, body.cashierName, "kanban:Queue"]
    );

    // Deduct ingredient stock based on menu recipes
    const orderedMenuIds = body.items
      .map(item => item.menuId && item.menuId > 0 ? item.menuId : menuMap.get(item.name.toLowerCase()) || null)
      .filter((id): id is number => id !== null);

    if (orderedMenuIds.length > 0) {
      const recipeResult = await client.query<{
        menu_id: number;
        ingredient_id: number;
        ingredient_name: string;
        recipe_qty: string;
        recipe_unit: string;
      }>(`
        SELECT
          mi.menu_id,
          mi.ingredient_id,
          i.name AS ingredient_name,
          mi.qty::text AS recipe_qty,
          mi.unit AS recipe_unit
        FROM menu_ingredients mi
        JOIN ingredients i ON i.id = mi.ingredient_id
        WHERE mi.menu_id = ANY($1::bigint[])
      `, [orderedMenuIds]);

      // Group recipes by menu_id
      const recipesByMenu = new Map<number, Array<{ ingredientId: number; name: string; qty: number; unit: string }>>();
      for (const row of recipeResult.rows) {
        if (!recipesByMenu.has(row.menu_id)) {
          recipesByMenu.set(row.menu_id, []);
        }
        recipesByMenu.get(row.menu_id)!.push({
          ingredientId: row.ingredient_id,
          name: row.ingredient_name,
          qty: Number(row.recipe_qty),
          unit: row.recipe_unit,
        });
      }

      // For each ordered item, deduct stock and record movement
      let movementSeq = 0;
      for (const item of body.items) {
        const menuId = item.menuId && item.menuId > 0 ? item.menuId : menuMap.get(item.name.toLowerCase()) || null;
        if (!menuId) continue;

        const ingredients = recipesByMenu.get(menuId);
        if (!ingredients) continue;

        for (const ing of ingredients) {
          const totalQty = ing.qty * item.qty;
          movementSeq++;

          // Deduct stock
          await client.query(
            `UPDATE ingredients SET stock = GREATEST(0, stock - $1), updated_at = NOW() WHERE id = $2`,
            [totalQty, ing.ingredientId]
          );

          // Record stock movement
          const mvCode = `MV-${body.orderCode}-${String(movementSeq).padStart(3, "0")}`;
          await client.query(
            `INSERT INTO stock_movements (movement_code, movement_date, ingredient_id, movement_type, qty, unit, reference_type, reference_code, notes, created_by)
             VALUES ($1, CURRENT_DATE, $2, 'out', $3, $4, 'sales_order', $5, $6, $7)
             ON CONFLICT (movement_code) DO NOTHING`,
            [mvCode, ing.ingredientId, totalQty, ing.unit, body.orderCode, `Pemakaian order ${body.orderCode}`, body.cashierName]
          );
        }
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true, salesOrderId, orderCode: body.orderCode });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Order code already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to save POS order" }, { status: 500 });
  } finally {
    client.release();
  }
}
