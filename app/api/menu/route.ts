import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type MenuIngredientPayload = {
  name?: string;
  qty?: number | string;
  unit?: string;
};

type CreateMenuPayload = {
  name?: string;
  category?: string;
  price?: number | string;
  ingredients?: MenuIngredientPayload[];
};

type PgError = Error & { code?: string };

export async function GET() {
  try {
    const [recipesResult, productsResult, ingredientsResult, lowStockMenusResult] = await Promise.all([
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
        GROUP BY m.id, m.name, m.category
        ORDER BY m.id
      `),
      db.query<{
        id: number;
        name: string;
        category: string;
        hpp: string;
        selling_price: string;
      }>(`
        SELECT
          m.id,
          m.name,
          m.category,
          mp.hpp,
          mp.selling_price
        FROM menus m
        JOIN menu_prices mp ON mp.menu_id = m.id AND mp.is_active = TRUE
        WHERE m.is_active = TRUE
        ORDER BY m.id
      `),
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
        ORDER BY name
      `),
      db.query<{ menu_id: number; ingredient_name: string }>(`
        SELECT DISTINCT mi.menu_id, i.name AS ingredient_name
        FROM menu_ingredients mi
        JOIN ingredients i ON i.id = mi.ingredient_id
        WHERE i.is_active = TRUE
          AND i.stock <= (CASE
            WHEN i.base_unit = 'pcs' THEN 100
            WHEN i.base_unit IN ('kg', 'liter') THEN 20
            ELSE 1000
          END)
      `),
    ]);

    const lowStockMenuMap = new Map<number, string[]>();
    for (const row of lowStockMenusResult.rows) {
      if (!lowStockMenuMap.has(row.menu_id)) {
        lowStockMenuMap.set(row.menu_id, []);
      }
      lowStockMenuMap.get(row.menu_id)!.push(row.ingredient_name);
    }

    return NextResponse.json({
      recipes: recipesResult.rows,
      products: productsResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        hpp: Number(row.hpp),
        price: Number(row.selling_price),
        lowStock: lowStockMenuMap.has(row.id),
        lowStockItems: lowStockMenuMap.get(row.id) || [],
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
        INSERT INTO menus (name, category)
        VALUES ($1, $2)
        RETURNING id
      `,
      [name, category]
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
        WHERE name = ANY($1::text[]) AND is_active = TRUE
      `,
      [ingredientNames]
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
