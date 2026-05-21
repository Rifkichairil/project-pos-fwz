import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("social login migration", () => {
  it("adds nullable password and social account table linked to users", () => {
    const migrationPath = join(
      process.cwd(),
      "database",
      "migrations",
      "016_add_social_login_support.sql"
    );

    const sql = readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("ALTER TABLE users");
    expect(sql).toContain("ALTER COLUMN password DROP NOT NULL");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS user_social_accounts");
    expect(sql).toContain("user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE");
    expect(sql).toContain("provider VARCHAR(50) NOT NULL");
    expect(sql).toContain("provider_user_id VARCHAR(255) NOT NULL");
    expect(sql).toContain("CHECK (provider IN ('google'))");
    expect(sql).toContain("UNIQUE (provider, provider_user_id)");
  });
});
