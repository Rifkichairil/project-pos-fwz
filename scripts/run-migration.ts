import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  connectionString: "postgresql://postgres:root@localhost:5432/warung_makan",
});

async function runMigration() {
  const migrationFile = path.join(__dirname, "../database/migrations/024_add_subscription_to_users.sql");
  const sql = fs.readFileSync(migrationFile, "utf-8");
  
  try {
    await pool.query(sql);
    console.log("Migration 024_add_subscription_to_users.sql executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
