const { Pool } = require("pg");
const DATABASE_URL = "postgresql://neondb_owner:npg_lP5dOLiQoAv7@ep-lingering-voice-apv6dy88-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const TENANT_ID = 3;

  const updates = [
    { name: "Beras", unit: "gram", price: 15, stock: 20000 },
    { name: "Ayam", unit: "gram", price: 55, stock: 5000 },
    { name: "Minyak Goreng", unit: "ml", price: 28, stock: 5000 },
    { name: "Telur", unit: "pcs", price: 2500, stock: 200 },
    { name: "Tepung Terigu", unit: "gram", price: 20, stock: 5000 },
    { name: "Gula Pasir", unit: "gram", price: 22, stock: 3000 },
    { name: "Kopi Robusta", unit: "gram", price: 50, stock: 2000 },
    { name: "Susu Cair", unit: "ml", price: 30, stock: 5000 },
    { name: "Air Mineral", unit: "ml", price: 2, stock: 50000 },
    { name: "Es Batu", unit: "gram", price: 5, stock: 10000 },
    { name: "Kecap Manis", unit: "ml", price: 35, stock: 2000 },
    { name: "Bawang Merah", unit: "gram", price: 40, stock: 2000 },
    { name: "Cabai", unit: "gram", price: 50, stock: 1000 },
    { name: "Mie Instan", unit: "pcs", price: 3000, stock: 100 },
    { name: "Roti Tawar", unit: "lembar", price: 1500, stock: 100 },
  ];

  for (const u of updates) {
    await pool.query(
      `UPDATE ingredients SET base_unit = $1, price_per_unit = $2, stock = $3, updated_at = NOW() WHERE name = $4 AND tenant_id = $5`,
      [u.unit, u.price, u.stock, u.name, TENANT_ID]
    );
  }

  console.log(`✓ ${updates.length} ingredients updated to small units (gram/ml/pcs)`);
  await pool.end();
}

main().catch(console.error);
