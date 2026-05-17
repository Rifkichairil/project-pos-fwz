BEGIN;

-- Create master addon table
CREATE TABLE IF NOT EXISTS addons (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrate existing menu_addons data to master addons table (take max price for duplicates)
INSERT INTO addons (name, price)
SELECT name, MAX(price) FROM menu_addons WHERE is_active = TRUE GROUP BY name
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- Create junction table for menu-addon assignments
CREATE TABLE IF NOT EXISTS menu_addon_assignments (
  menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  addon_id BIGINT NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (menu_id, addon_id)
);

-- Migrate existing assignments
INSERT INTO menu_addon_assignments (menu_id, addon_id)
SELECT DISTINCT ma.menu_id, a.id
FROM menu_addons ma
JOIN addons a ON a.name = ma.name
WHERE ma.is_active = TRUE
ON CONFLICT (menu_id, addon_id) DO NOTHING;

COMMIT;
