const { Pool } = require("pg");

const DATABASE_URL = "postgresql://neondb_owner:npg_lP5dOLiQoAv7@ep-lingering-voice-apv6dy88-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
const TENANT_ID = 3;

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  // Check tenant exists
  const tenantCheck = await pool.query("SELECT id, name FROM tenants WHERE id = $1", [TENANT_ID]);
  if (tenantCheck.rows.length === 0) {
    console.error(`Tenant ${TENANT_ID} not found!`);
    await pool.end();
    return;
  }
  console.log(`Seeding data for tenant: ${tenantCheck.rows[0].name} (id: ${TENANT_ID})\n`);

  // --- INGREDIENTS ---
  console.log("Inserting ingredients...");
  const ingredients = [
    { name: "Beras", unit: "kg", price: 15000, stock: 20 },
    { name: "Ayam", unit: "kg", price: 55000, stock: 5 },
    { name: "Minyak Goreng", unit: "liter", price: 28000, stock: 5 },
    { name: "Telur", unit: "pcs", price: 2500, stock: 200 },
    { name: "Tepung Terigu", unit: "kg", price: 20000, stock: 5 },
    { name: "Gula Pasir", unit: "kg", price: 22000, stock: 3 },
    { name: "Kopi Robusta", unit: "kg", price: 50000, stock: 2 },
    { name: "Susu Cair", unit: "liter", price: 30000, stock: 5 },
    { name: "Air Mineral", unit: "galon", price: 10000, stock: 10 },
    { name: "Es Batu", unit: "kg", price: 5000, stock: 10 },
    { name: "Kecap Manis", unit: "botol", price: 15000, stock: 5 },
    { name: "Bawang Merah", unit: "kg", price: 40000, stock: 2 },
    { name: "Cabai", unit: "kg", price: 50000, stock: 1 },
    { name: "Mie Instan", unit: "pcs", price: 3000, stock: 100 },
    { name: "Roti Tawar", unit: "bungkus", price: 15000, stock: 10 },
  ];

  for (const ing of ingredients) {
    await pool.query(
      `INSERT INTO ingredients (name, base_unit, price_per_unit, stock, tenant_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name) DO UPDATE SET base_unit = $2, price_per_unit = $3, stock = $4, tenant_id = $5, updated_at = NOW()`,
      [ing.name, ing.unit, ing.price, ing.stock, TENANT_ID]
    );
  }
  console.log(`  ✓ ${ingredients.length} ingredients inserted`);

  // --- MENUS ---
  console.log("\nInserting menus...");
  const menus = [
    { name: "Nasi Goreng", category: "Makanan", hpp: 8000, price: 20000 },
    { name: "Nasi Ayam Goreng", category: "Makanan", hpp: 12000, price: 25000 },
    { name: "Mie Goreng", category: "Makanan", hpp: 6000, price: 18000 },
    { name: "Nasi Telur", category: "Makanan", hpp: 5000, price: 15000 },
    { name: "Ayam Geprek", category: "Makanan", hpp: 10000, price: 22000 },
    { name: "Kopi Susu", category: "Minuman", hpp: 4000, price: 12000 },
    { name: "Kopi Hitam", category: "Minuman", hpp: 2500, price: 8000 },
    { name: "Es Teh Manis", category: "Minuman", hpp: 1500, price: 5000 },
    { name: "Es Jeruk", category: "Minuman", hpp: 2000, price: 7000 },
    { name: "Air Mineral", category: "Minuman", hpp: 500, price: 3000 },
  ];

  for (const menu of menus) {
    const result = await pool.query(
      `INSERT INTO menus (name, category, tenant_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET category = $2, tenant_id = $3, updated_at = NOW()
       RETURNING id`,
      [menu.name, menu.category, TENANT_ID]
    );
    const menuId = result.rows[0].id;

    // Deactivate old prices
    await pool.query(
      `UPDATE menu_prices SET is_active = FALSE, end_date = CURRENT_DATE WHERE menu_id = $1 AND is_active = TRUE`,
      [menuId]
    );

    // Insert new price
    await pool.query(
      `INSERT INTO menu_prices (menu_id, hpp, selling_price, start_date, is_active)
       VALUES ($1, $2, $3, CURRENT_DATE, TRUE)
       ON CONFLICT (menu_id, start_date) DO UPDATE SET hpp = $2, selling_price = $3, is_active = TRUE, end_date = NULL, updated_at = NOW()`,
      [menuId, menu.hpp, menu.price]
    );
  }
  console.log(`  ✓ ${menus.length} menus inserted with prices`);

  // --- SETTINGS ---
  console.log("\nInserting settings...");
  await pool.query(
    `INSERT INTO settings (tenant_id, store_name, address, wifi_password, pb1_enabled, pb1_rate, service_enabled, service_rate, ppn_enabled, ppn_rate, qris_image_url, inventory_policy, point_enabled, point_value, point_per_rupiah, require_customer_info, simple_mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (tenant_id) DO UPDATE SET
       store_name = EXCLUDED.store_name,
       address = EXCLUDED.address,
       updated_at = NOW()`,
    [TENANT_ID, tenantCheck.rows[0].name, "", "", false, 0, false, 0, false, 0, "", "off", false, 1, 10000, false, true]
  );
  console.log("  ✓ Settings configured (simple mode, no tax, no customer info required)");

  await pool.end();
  console.log("\n✅ Done! Tenant 3 seeded successfully.");
}

main().catch(console.error);
