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
  min_stock: string;
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
        SELECT id, name, base_unit, price_per_unit, supplier, stock, COALESCE(min_stock, 0) as min_stock
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
        minStock: Number(ingredient.min_stock) || getMinStock(ingredient.base_unit),
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


export async function POST(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const body = (await request.json()) as {
      action: "addIngredient" | "addPurchase" | "addMovement" | "restock";
      // addIngredient
      name?: string;
      unit?: string;
      price?: number;
      supplier?: string;
      stock?: number;
      minStock?: number;
      // addPurchase
      item?: string;
      qty?: number;
      pricePerUnit?: number;
      date?: string;
      // addMovement
      ingredientName?: string;
      type?: "in" | "out" | "adjustment";
      ref?: string;
      user?: string;
      // restock
      ingredientId?: number;
    };

    const tenantId = tenant.context.tenantId;

    if (body.action === "addIngredient") {
      const { name, unit, price, supplier, stock } = body;
      if (!name || !unit || !price) {
        return NextResponse.json({ error: "Nama, unit, dan harga wajib diisi" }, { status: 400 });
      }

      const result = await db.query<{ id: number }>(
        `INSERT INTO ingredients (name, base_unit, price_per_unit, supplier, stock, min_stock, tenant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [name.trim(), unit, price, supplier?.trim() || null, stock || 0, body.minStock || 0, tenantId]
      );

      return NextResponse.json({ success: true, id: result.rows[0].id }, { status: 201 });
    }

    if (body.action === "addMovement" || body.action === "restock") {
      const ingredientId = body.ingredientId;
      const ingredientName = body.ingredientName || body.item;
      const qty = body.qty;
      const type = body.type || "in";
      const ref = body.ref || (body.action === "restock" ? "Restock" : "-");
      const user = body.user || "Admin";

      if (!qty || qty <= 0) {
        return NextResponse.json({ error: "Qty harus lebih dari 0" }, { status: 400 });
      }

      // Find ingredient by id or name
      let ingId = ingredientId;
      let ingUnit = body.unit || "pcs";
      if (!ingId && ingredientName) {
        const ingResult = await db.query<{ id: number; base_unit: string }>(
          `SELECT id, base_unit FROM ingredients WHERE name = $1 AND tenant_id = $2 AND is_active = TRUE LIMIT 1`,
          [ingredientName, tenantId]
        );
        if (ingResult.rows.length === 0) {
          return NextResponse.json({ error: "Ingredient tidak ditemukan" }, { status: 404 });
        }
        ingId = ingResult.rows[0].id;
        ingUnit = ingResult.rows[0].base_unit;
      }

      if (!ingId) {
        return NextResponse.json({ error: "Ingredient ID atau nama wajib diisi" }, { status: 400 });
      }

      // Generate movement code
      const countResult = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM stock_movements WHERE tenant_id = $1`, [tenantId]
      );
      const movementCode = `MV-${String(Number(countResult.rows[0].count) + 1).padStart(3, "0")}`;

      // Insert movement
      await db.query(
        `INSERT INTO stock_movements (movement_code, ingredient_id, movement_type, qty, unit, reference_code, created_by, tenant_id, movement_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)`,
        [movementCode, ingId, type, qty, ingUnit, ref, user, tenantId]
      );

      // Update stock
      if (type === "in") {
        await db.query(`UPDATE ingredients SET stock = stock + $1, updated_at = NOW() WHERE id = $2`, [qty, ingId]);
      } else if (type === "out") {
        await db.query(`UPDATE ingredients SET stock = stock - $1, updated_at = NOW() WHERE id = $2`, [qty, ingId]);
      }

      return NextResponse.json({ success: true, movementCode }, { status: 201 });
    }

    if (body.action === "addPurchase") {
      const { item, qty, pricePerUnit, supplier, date } = body;
      if (!item || !qty || !pricePerUnit) {
        return NextResponse.json({ error: "Item, qty, dan harga wajib diisi" }, { status: 400 });
      }

      // Find ingredient
      const ingResult = await db.query<{ id: number; base_unit: string }>(
        `SELECT id, base_unit FROM ingredients WHERE name = $1 AND tenant_id = $2 AND is_active = TRUE LIMIT 1`,
        [item, tenantId]
      );
      if (ingResult.rows.length === 0) {
        return NextResponse.json({ error: "Ingredient tidak ditemukan" }, { status: 404 });
      }
      const ingId = ingResult.rows[0].id;
      const ingUnit = ingResult.rows[0].base_unit;

      // Find or create supplier
      let supplierId: number;
      const supplierName = supplier?.trim() || "Unknown";
      const suppResult = await db.query<{ id: number }>(
        `SELECT id FROM suppliers WHERE name = $1 AND tenant_id = $2 LIMIT 1`,
        [supplierName, tenantId]
      );
      if (suppResult.rows.length > 0) {
        supplierId = suppResult.rows[0].id;
      } else {
        const newSupp = await db.query<{ id: number }>(
          `INSERT INTO suppliers (name, tenant_id) VALUES ($1, $2) RETURNING id`,
          [supplierName, tenantId]
        );
        supplierId = newSupp.rows[0].id;
      }

      // Generate PO code
      const poCountResult = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM purchase_orders WHERE tenant_id = $1`, [tenantId]
      );
      const poCode = `PO-2026-${String(Number(poCountResult.rows[0].count) + 1).padStart(3, "0")}`;

      // Create purchase order
      const poResult = await db.query<{ id: number }>(
        `INSERT INTO purchase_orders (po_code, supplier_id, order_date, tenant_id)
         VALUES ($1, $2, $3::date, $4) RETURNING id`,
        [poCode, supplierId, date || new Date().toISOString().split("T")[0], tenantId]
      );

      // Create purchase order item
      const lineTotal = qty * pricePerUnit;
      await db.query(
        `INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, qty, unit, price_per_unit, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [poResult.rows[0].id, ingId, qty, ingUnit, pricePerUnit, lineTotal]
      );

      // Update stock and price (purchase = stock in, price updated to latest purchase price)
      await db.query(`UPDATE ingredients SET stock = stock + $1, price_per_unit = $2, updated_at = NOW() WHERE id = $3`, [qty, pricePerUnit, ingId]);

      // Create stock movement for the purchase
      const mvCountResult = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text as count FROM stock_movements WHERE tenant_id = $1`, [tenantId]
      );
      const mvCode = `MV-${String(Number(mvCountResult.rows[0].count) + 1).padStart(3, "0")}`;
      await db.query(
        `INSERT INTO stock_movements (movement_code, ingredient_id, movement_type, qty, unit, reference_code, created_by, tenant_id, movement_date)
         VALUES ($1, $2, 'in', $3, $4, $5, 'Purchase', $6, CURRENT_DATE)`,
        [mvCode, ingId, qty, ingUnit, poCode, tenantId]
      );

      return NextResponse.json({ success: true, poCode }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Inventory POST error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
