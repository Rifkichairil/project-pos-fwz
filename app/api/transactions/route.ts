import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type PaymentMethodUi = "Cash" | "QRIS" | "Debit" | "OVO" | "GoPay" | "Transfer";
type PaymentStatusUi = "Success" | "Pending" | "Failed";
type OrderStatusUi = "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";

type TransactionRow = {
  order_code: string;
  order_at: string;
  order_status: "draft" | "open" | "paid" | "cancelled" | "refunded";
  total_amount: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  service_amount: string;
  notes: string | null;
  cashier_name: string;
  items_count: number;
  payment_method: "cash" | "qris" | "card" | "e_wallet" | "transfer" | null;
  payment_status: "pending" | "paid" | "failed" | "voided" | "refunded" | null;
  kanban_note: string | null;
  menu_items: Array<{ name: string; qty: number; price: number; variant?: string; sugar?: string; note?: string }>;
  refund_amount: string;
};

function parseOrderMeta(notes: string | null) {
  if (!notes) return { customer: "Guest", type: "Takeaway" };

  const customer = notes.match(/customer=([^;]+)/)?.[1]?.trim() || "Guest";
  const typeRaw = notes.match(/order_type=([^;]+)/)?.[1]?.trim() || "takeaway";

  let type = "Takeaway";
  if (typeRaw === "delivery") type = "Delivery";
  if (typeRaw === "dine in" || typeRaw === "dinein") type = "Dine in";

  return { customer, type };
}

function mapMethod(method: TransactionRow["payment_method"]): PaymentMethodUi {
  if (method === "qris") return "QRIS";
  if (method === "card") return "Debit";
  if (method === "e_wallet") return "OVO";
  if (method === "transfer") return "Transfer";
  return "Cash";
}

function mapPaymentStatus(status: TransactionRow["payment_status"]): PaymentStatusUi {
  if (status === "pending") return "Pending";
  if (status === "failed" || status === "voided") return "Failed";
  return "Success";
}

function mapOrderStatus(orderStatus: TransactionRow["order_status"], kanbanNote: string | null): OrderStatusUi {
  if (kanbanNote?.startsWith("kanban:")) {
    const status = kanbanNote.slice(7);
    if (status === "Queue") return "Pending";
    if (status === "Process") return "Preparing";
    if (status === "Ready") return "Ready";
    if (status === "Served") return "Completed";
    if (status === "Refund") return "Cancelled";
    // Legacy support
    if (status === "Waiting") return "Pending";
    if (status === "Done") return "Completed";
    if (status === "Cancel") return "Cancelled";
  }

  if (orderStatus === "cancelled" || orderStatus === "refunded") return "Cancelled";
  if (orderStatus === "paid") return "Completed";
  if (orderStatus === "open") return "Preparing";
  return "Pending";
}

export async function GET(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit") || "30");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 1000) : 300;

  try {
    const result = await db.query<TransactionRow>(
      `
        SELECT
          so.order_code,
          so.order_at::text,
          so.status AS order_status,
          so.total_amount::text,
          so.subtotal::text,
          so.discount_amount::text,
          so.tax_amount::text,
          so.service_amount::text,
          so.notes,
          so.cashier_name,
          COALESCE(items.items_count, 0)::int AS items_count,
          COALESCE(items.menu_items, '[]'::json) AS menu_items,
          COALESCE(items.refund_amount, 0)::text AS refund_amount,
          pay.method AS payment_method,
          pay.status AS payment_status,
          kanban.kanban_note
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
            ) AS menu_items,
            COALESCE(SUM(CASE WHEN soi.note LIKE '%[REFUNDED]%' THEN soi.line_total ELSE 0 END), 0) AS refund_amount
          FROM sales_order_items soi
          WHERE soi.sales_order_id = so.id
        ) items ON TRUE
        LEFT JOIN LATERAL (
          SELECT op.method, op.status
          FROM order_payments op
          WHERE op.sales_order_id = so.id
          ORDER BY op.created_at DESC, op.id DESC
          LIMIT 1
        ) pay ON TRUE
        LEFT JOIN LATERAL (
          SELECT osh.note AS kanban_note
          FROM order_status_history osh
          WHERE osh.sales_order_id = so.id
            AND osh.note LIKE 'kanban:%'
          ORDER BY osh.changed_at DESC, osh.id DESC
          LIMIT 1
        ) kanban ON TRUE
        WHERE so.tenant_id = $2
        ORDER BY so.order_at DESC
        LIMIT $1
      `,
      [limit, tenant.context.tenantId]
    );

    const transactions = result.rows.map((row) => {
      const orderAt = new Date(row.order_at);
      const { customer, type } = parseOrderMeta(row.notes);

      return {
        id: row.order_code,
        date: orderAt.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).replace(/\//g, "-"),
        time: orderAt.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        customer,
        type,
        items: Number(row.items_count),
        total: Number(row.total_amount),
        subtotal: Number(row.subtotal),
        discount: Number(row.discount_amount),
        tax: Number(row.tax_amount),
        service: Number(row.service_amount),
        handledBy: row.cashier_name,
        method: mapMethod(row.payment_method),
        paymentStatus: mapPaymentStatus(row.payment_status),
        orderStatus: mapOrderStatus(row.order_status, row.kanban_note),
        menuItems: (row.menu_items || []).map((item) => ({
          name: item.name,
          qty: Number(item.qty),
          price: Number(item.price),
          variant: item.variant || null,
          sugar: item.sugar || null,
          note: item.note || null,
        })),
        refundAmount: Number(row.refund_amount || 0),
      };
    });

    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}
