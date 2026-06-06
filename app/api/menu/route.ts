import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenantScope } from "@/lib/tenant-scope";

type MenuIngredientPayload = {
  name?: string;
  qty?: number | string;
  unit?: string;
};

type CreateMenuPayload = {
  name?: string;
  category?: string;
  price?: number | string;
  imageUrl?: string | null;
  ingredients?: MenuIngredientPayload[];
  addonIds?: number[];
};

type EditMenuPayload = {
  id?: number;
  name?: string;
  category?: string;
  price?: number | string;
  imageUrl?: string | null;
  ingredients?: MenuIngredientPayload[];
  addonIds?: number[];
};

type PgError = Error & { code?: string };

export async function GET() {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  try {
    const tenantId = tenant.context.tenantId;
    const isAdmin = tenant.context.role === "admin";

    const [recipesResult, productsResult, ingredientsResult, addonsResult, settingsResult] = await Promise.all([
      db.query<{
        id: number;
        name: string;
        category: string;
        ingredients: Array<{ name: string; qty: number; unit: string }>;
      }>(`
        SELECT
          m.id,
          m.name,
          m.category,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'name', i.name,
                'qty', mi.qty,
                'unit', mi.unit
              )
              ORDER BY i.name
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'::json
          ) AS ingredients
        FROM menus m
        LEFT JOIN menu_ingredients mi ON mi.menu_id = m.id
        LEFT JOIN ingredients i ON i.id = mi.ingredient_id
        WHERE m.is_active = TRUE
          AND m.tenant_id = $1
        GROUP BY m.id, m.name, m.category
        ORDER BY m.id
      `,
      [tenantId]),
      db.query<{
        id: number;
        name: string;
        category: string;
        hpp: string;
        selling_price: string;
        image_url: string | null;
      }>(`
        SELECT
          m.id,
          m.name,
          m.category,
          mp.hpp,
          mp.selling_price,
          m.image_url
        FROM menus m
        JOIN menu_prices mp ON mp.menu_id = m.id AND mp.is_active = TRUE
        WHERE m.is_active = TRUE
          AND m.tenant_id = $1
        ORDER BY m.id
      `,
      [tenantId]),
      db.query<{
        name: string;
        base_unit: string;
        price_per_unit: string;
        supplier: string | null;
        stock: string;
      }>(`
        SELECT
          name,
          base_unit,
          price_per_unit,
          supplier,
          stock
        FROM ingredients
        WHERE is_active = TRUE
          AND tenant_id = $1
        ORDER BY name
      `,
      [tenantId]),
      db.query<{ menu_id: number; addon_id: number; addon_name: string; addon_price: string }>(`
        SELECT maa.menu_id, a.id AS addon_id, a.name AS addon_name, a.price::text AS addon_price
        FROM menu_addon_assignments maa
        JOIN addons a ON a.id = maa.addon_id AND a.is_active = TRUE
        WHERE maa.tenant_id = $1
          AND a.tenant_id = $1
        ORDER BY maa.menu_id, a.name
      `,
      [tenantId]),
      db.query<{ inventory_policy: string }>(
        `SELECT inventory_policy FROM settings WHERE tenant_id = $1`,
        [tenantId]
      ),
    ]);

    const inventoryPolicy = settingsResult.rows[0]?.inventory_policy || "medium";
    const LOW_PORTIONS = 5;

    const addonsMap = new Map<number, Array<{ id: number; name: string; price: number }>>();
    for (const row of addonsResult.rows) {
      if (!addonsMap.has(row.menu_id)) {
        addonsMap.set(row.menu_id, []);
      }
      addonsMap.get(row.menu_id)!.push({ id: row.addon_id, name: row.addon_name, price: Number(row.addon_price) });
    }

    // Build ingredient stock map
    const ingredientStockMap = new Map<string, number>();
    for (const row of ingredientsResult.rows) {
      ingredientStockMap.set(row.name, Number(row.stock));
    }

    // Calculate max portions per menu: min floor(stock / recipe_qty) across ingredients
    const menuMaxPortions = new Map<number, number>();
    for (const recipe of recipesResult.rows) {
      if (recipe.ingredients.length === 0) {
        menuMaxPortions.set(recipe.id, Number.MAX_SAFE_INTEGER);
        continue;
      }
      let minPortions = Number.MAX_SAFE_INTEGER;
      for (const ing of recipe.ingredients) {
        const stock = ingredientStockMap.get(ing.name) ?? 0;
        const portions = Math.floor(stock / ing.qty);
        if (portions < minPortions) minPortions = portions;
      }
      menuMaxPortions.set(recipe.id, minPortions);
    }

    // Build lowStock info: ingredients that are limiting portions
    const lowStockMenuMap = new Map<number, string[]>();
    const soldOutMenuIds = new Set<number>();
    for (const recipe of recipesResult.rows) {
      const maxP = menuMaxPortions.get(recipe.id) ?? Number.MAX_SAFE_INTEGER;
      if (maxP === 0 && inventoryPolicy === "strict") {
        soldOutMenuIds.add(recipe.id);
      }
      if (maxP > 0 && maxP <= LOW_PORTIONS && inventoryPolicy !== "off") {
        const limiting: string[] = [];
        for (const ing of recipe.ingredients) {
          const stock = ingredientStockMap.get(ing.name) ?? 0;
          if (Math.floor(stock / ing.qty) <= LOW_PORTIONS) {
            limiting.push(ing.name);
          }
        }
        lowStockMenuMap.set(recipe.id, limiting);
      }
    }

    return NextResponse.json({
      recipes: recipesResult.rows,
      inventoryPolicy,
      products: productsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        hpp: Number(row.hpp),
        price: Number(row.selling_price),
        imageUrl: row.image_url || null,
        lowStock: inventoryPolicy !== "off" && lowStockMenuMap.has(row.id),
        lowStockItems: lowStockMenuMap.get(row.id) || [],
        soldOut: inventoryPolicy === "strict" && soldOutMenuIds.has(row.id),
        maxPortions: menuMaxPortions.get(row.id) ?? Number.MAX_SAFE_INTEGER,
        addons: addonsMap.get(row.id) || [],
      })),
      ingredients: ingredientsResult.rows.map((row) => ({
        name: row.name,
        unit: row.base_unit,
        price: Number(row.price_per_unit),
        supplier: row.supplier,
        stock: Number(row.stock),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load menu data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  const body = (await request.json()) as CreateMenuPayload;

  const name = body.name?.trim();
  const category = body.category?.trim();
  const price = Number(body.price);
  const incomingIngredients = Array.isArray(body.ingredients) ? body.ingredients : [];

  const ingredients = incomingIngredients
    .map((ingredient) => ({
      name: ingredient.name?.trim() ?? "",
      qty: Number(ingredient.qty),
      unit: ingredient.unit?.trim() ?? "",
    }))
    .filter((ingredient) => ingredient.name && Number.isFinite(ingredient.qty) && ingredient.qty > 0);

  if (!name || !category || !Number.isFinite(price) || price <= 0 || ingredients.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const menuInsert = await client.query<{ id: number }>(
      `
        INSERT INTO menus (tenant_id, name, category, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `,
      [tenant.context.tenantId, name, category, body.imageUrl || null]
    );

    const menuId = menuInsert.rows[0].id;
    const ingredientNames = ingredients.map((ingredient) => ingredient.name);

    const ingredientRows = await client.query<{
      id: number;
      name: string;
      base_unit: string;
      price_per_unit: string;
    }>(
      `
        SELECT id, name, base_unit, price_per_unit
        FROM ingredients
        WHERE name = ANY($1::text[])
          AND is_active = TRUE
          AND tenant_id = $2
      `,
      [ingredientNames, tenant.context.tenantId]
    );

    const ingredientMap = new Map(ingredientRows.rows.map((row) => [row.name, row]));
    const missingIngredient = ingredientNames.find((ingredientName) => !ingredientMap.has(ingredientName));

    if (missingIngredient) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: `Ingredient not found: ${missingIngredient}` },
        { status: 400 }
      );
    }

    let hpp = 0;

    for (const ingredient of ingredients) {
      const row = ingredientMap.get(ingredient.name)!;
      const unitPrice = Number(row.price_per_unit);
      const resolvedUnit = ingredient.unit || row.base_unit;

      await client.query(
        `
          INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit)
          VALUES ($1, $2, $3, $4)
        `,
        [menuId, row.id, ingredient.qty, resolvedUnit]
      );

      hpp += ingredient.qty * unitPrice;
    }

    await client.query(
      `
        INSERT INTO menu_prices (menu_id, hpp, selling_price, start_date, is_active)
        VALUES ($1, $2, $3, CURRENT_DATE, TRUE)
      `,
      [menuId, hpp, price]
    );

    // Assign addons to menu
    const addonIds = Array.isArray(body.addonIds) ? body.addonIds.filter((id) => Number.isFinite(id) && id > 0) : [];
    for (const addonId of addonIds) {
      await client.query(
        `INSERT INTO menu_addon_assignments (tenant_id, menu_id, addon_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [tenant.context.tenantId, menuId, addonId]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        menu: {
          id: menuId,
          name,
          category,
          hpp,
          price,
          ingredients,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    const pgError = error as PgError;

    if (pgError.code === "23505") {
      return NextResponse.json({ error: "Menu name already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(request: Request) {
  const tenant = await requireTenantScope();
  if ("error" in tenant) return tenant.error;

  const body = (await request.json()) as EditMenuPayload;

  const menuId = Number(body.id);
  if (!Number.isFinite(menuId) || menuId <= 0) {
    return NextResponse.json({ error: "Invalid menu ID" }, { status: 400 });
  }

  const name = body.name?.trim();
  const category = body.category?.trim();
  const price = body.price !== undefined ? Number(body.price) : undefined;
  const incomingIngredients = Array.isArray(body.ingredients) ? body.ingredients : undefined;

  const ingredients = incomingIngredients
    ?.map((ingredient) => ({
      name: ingredient.name?.trim() ?? "",
      qty: Number(ingredient.qty),
      unit: ingredient.unit?.trim() ?? "",
    }))
    .filter((ingredient) => ingredient.name && Number.isFinite(ingredient.qty) && ingredient.qty > 0);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Verify menu exists
    const existing = await client.query<{ id: number }>(
      `SELECT id FROM menus WHERE id = $1 AND tenant_id = $2 AND is_active = TRUE`,
      [menuId, tenant.context.tenantId]
    );
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Update menus table (name, category, image_url)
    const imageUrl = body.imageUrl !== undefined ? body.imageUrl : undefined;
    if (name || category || imageUrl !== undefined) {
      const setClauses: string[] = [];
      const values: (string | number | null)[] = [];
      let paramIdx = 1;

      if (name) {
        setClauses.push(`name = $${paramIdx++}`);
        values.push(name);
      }
      if (category) {
        setClauses.push(`category = $${paramIdx++}`);
        values.push(category);
      }
      if (imageUrl !== undefined) {
        setClauses.push(`image_url = $${paramIdx++}`);
        values.push(imageUrl || null);
      }

      values.push(menuId, tenant.context.tenantId);
      await client.query(
        `UPDATE menus SET ${setClauses.join(", ")} WHERE id = $${paramIdx} AND tenant_id = $${paramIdx + 1}`,
        values
      );
    }

    // Update ingredients (replace all)
    let hpp: number | undefined;
    if (ingredients && ingredients.length > 0) {
      // Delete old ingredients
      await client.query(`DELETE FROM menu_ingredients WHERE menu_id = $1`, [menuId]);

      const ingredientNames = ingredients.map((ing) => ing.name);
      const ingredientRows = await client.query<{
        id: number;
        name: string;
        base_unit: string;
        price_per_unit: string;
      }>(
        `SELECT id, name, base_unit, price_per_unit FROM ingredients WHERE name = ANY($1::text[]) AND is_active = TRUE AND tenant_id = $2`,
        [ingredientNames, tenant.context.tenantId]
      );

      const ingredientMap = new Map(ingredientRows.rows.map((row) => [row.name, row]));
      const missingIngredient = ingredientNames.find((n) => !ingredientMap.has(n));

      if (missingIngredient) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: `Ingredient not found: ${missingIngredient}` },
          { status: 400 }
        );
      }

      hpp = 0;
      for (const ingredient of ingredients) {
        const row = ingredientMap.get(ingredient.name)!;
        const unitPrice = Number(row.price_per_unit);
        const resolvedUnit = ingredient.unit || row.base_unit;

        await client.query(
          `INSERT INTO menu_ingredients (menu_id, ingredient_id, qty, unit) VALUES ($1, $2, $3, $4)`,
          [menuId, row.id, ingredient.qty, resolvedUnit]
        );

        hpp += ingredient.qty * unitPrice;
      }
    }

    // Update menu_prices (selling_price and/or hpp)
    if (price !== undefined || hpp !== undefined) {
      // Deactivate old price
      await client.query(
        `UPDATE menu_prices SET is_active = FALSE WHERE menu_id = $1 AND is_active = TRUE`,
        [menuId]
      );

      // If hpp wasn't recalculated from ingredients, get the old hpp
      if (hpp === undefined) {
        const oldPrice = await client.query<{ hpp: string }>(
          `SELECT hpp FROM menu_prices WHERE menu_id = $1 ORDER BY id DESC LIMIT 1`,
          [menuId]
        );
        hpp = oldPrice.rows.length > 0 ? Number(oldPrice.rows[0].hpp) : 0;
      }

      const sellingPrice = price !== undefined && Number.isFinite(price) && price > 0
        ? price
        : (await client.query<{ selling_price: string }>(
            `SELECT selling_price FROM menu_prices WHERE menu_id = $1 ORDER BY id DESC LIMIT 1`,
            [menuId]
          )).rows[0]?.selling_price ?? 0;

      await client.query(
        `INSERT INTO menu_prices (menu_id, hpp, selling_price, start_date, is_active) VALUES ($1, $2, $3, CURRENT_DATE, TRUE)`,
        [menuId, hpp, sellingPrice]
      );
    }

    // Update addon assignments (replace all)
    if (Array.isArray(body.addonIds)) {
      await client.query(`DELETE FROM menu_addon_assignments WHERE menu_id = $1 AND tenant_id = $2`, [menuId, tenant.context.tenantId]);

      const addonIds = body.addonIds.filter((id) => Number.isFinite(id) && id > 0);
      for (const addonId of addonIds) {
        await client.query(
          `INSERT INTO menu_addon_assignments (tenant_id, menu_id, addon_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [tenant.context.tenantId, menuId, addonId]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true, menuId });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {}

    const pgError = error as PgError;

    if (pgError.code === "23505") {
      return NextResponse.json({ error: "Menu name already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update menu" }, { status: 500 });
  } finally {
    client.release();
  }
}
