import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type IngredientRow = {
  id: number;
  name: string;
  base_unit: string;
  price_per_unit: string;
  supplier: string | null;
  stock: string;
};

type MovementAggregateRow = {
  ingredient_id: number;
  qty_in_30d: string;
  qty_out_30d: string;
};

type PurchaseRow = {
  po_code: string;
  order_date: string;
  ingredient_name: string;
  qty: string;
  unit: string;
  price_per_unit: string;
  line_total: string;
  supplier_name: string;
};

type MovementRow = {
  movement_code: string;
  movement_date: string;
  ingredient_name: string;
  movement_type: "in" | "out" | "adjustment";
  qty: string;
  unit: string;
  reference_code: string | null;
  created_by: string;
};

const formatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function formatDate(value: string) {
  return formatter.format(new Date(value));
}

function getMinStock(unit: string) {
  if (unit === "pcs") return 100;
  if (unit === "kg" || unit === "liter") return 20;
  return 1000;
}

export async function GET() {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const tenantId = tenant.context.tenantId;

    const [ingredientsResult, movementAggregateResult, purchasesResult, movementsResult] = await Promise.all([
      db.query<IngredientRow>(`
        SELECT id, name, base_unit, price_per_unit, supplier, stock
        FROM ingredients
        WHERE is_active = TRUE AND tenant_id = $1
        ORDER BY id
      `, [tenantId]),
      db.query<MovementAggregateRow>(`
        SELECT
          ingredient_id,
          COALESCE(SUM(CASE WHEN movement_type = 'in' THEN qty ELSE 0 END), 0)::text AS qty_in_30d,
          COALESCE(SUM(CASE WHEN movement_type = 'out' THEN qty ELSE 0 END), 0)::text AS qty_out_30d
        FROM stock_movements
        WHERE movement_date >= CURRENT_DATE - INTERVAL '30 days' AND tenant_id = $1
        GROUP BY ingredient_id
      `, [tenantId]),
      db.query<PurchaseRow>(`
        SELECT
          po.po_code,
          po.order_date,
          i.name AS ingredient_name,
          poi.qty,
          poi.unit,
          poi.price_per_unit,
          poi.line_total,
          s.name AS supplier_name
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
        JOIN ingredients i ON i.id = poi.ingredient_id
        WHERE i.tenant_id = $1
        ORDER BY po.order_date DESC, po.id DESC, poi.id ASC
      `, [tenantId]),
      db.query<MovementRow>(`
        SELECT
          sm.movement_code,
          sm.movement_date,
          i.name AS ingredient_name,
          sm.movement_type,
          sm.qty,
          sm.unit,
          sm.reference_code,
          sm.created_by
        FROM stock_movements sm
        JOIN ingredients i ON i.id = sm.ingredient_id
        WHERE sm.tenant_id = $1
        ORDER BY sm.movement_date DESC, sm.id DESC
      `, [tenantId]),
    ]);

    const movementByIngredient = new Map<number, MovementAggregateRow>();
    for (const row of movementAggregateResult.rows) {
      movementByIngredient.set(row.ingredient_id, row);
    }

    const ingredients = ingredientsResult.rows.map((ingredient) => {
      const movement = movementByIngredient.get(ingredient.id);

      return {
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.base_unit,
        price: Number(ingredient.price_per_unit),
        supplier: ingredient.supplier || "-",
        stock: Number(ingredient.stock),
        minStock: getMinStock(ingredient.base_unit),
        in30d: Number(movement?.qty_in_30d || 0),
        out30d: Number(movement?.qty_out_30d || 0),
      };
    });

    const purchases = purchasesResult.rows.map((purchase) => ({
      id: purchase.po_code,
      date: formatDate(purchase.order_date),
      item: purchase.ingredient_name,
      qty: Number(purchase.qty),
      unit: purchase.unit,
      price: Number(purchase.price_per_unit),
      total: Number(purchase.line_total),
      supplier: purchase.supplier_name,
    }));

    const movements = movementsResult.rows.map((movement) => ({
      id: movement.movement_code,
      date: formatDate(movement.movement_date),
      item: movement.ingredient_name,
      type: movement.movement_type,
      qty: Number(movement.qty),
      unit: movement.unit,
      ref: movement.reference_code || "-",
      user: movement.created_by,
    }));

    return NextResponse.json({ ingredients, purchases, movements });
  } catch {
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}
