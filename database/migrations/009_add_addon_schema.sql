BEGIN;

-- Addon definitions (available addons per menu)
CREATE TABLE IF NOT EXISTS menu_addons (
  id BIGSERIAL PRIMARY KEY,
  menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (menu_id, name)
);

CREATE INDEX IF NOT EXISTS idx_menu_addons_menu_id ON menu_addons(menu_id);

-- Addons selected per order item
CREATE TABLE IF NOT EXISTS order_item_addons (
  id BIGSERIAL PRIMARY KEY,
  sales_order_item_id BIGINT NOT NULL REFERENCES sales_order_items(id) ON DELETE CASCADE,
  addon_name VARCHAR(120) NOT NULL,
  addon_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_item_addons_item_id ON order_item_addons(sales_order_item_id);

-- Seed some addons for existing menus
INSERT INTO menu_addons (menu_id, name, price)
SELECT m.id, v.addon_name, v.addon_price
FROM (
  VALUES
    ('Nasi Goreng', 'Extra Telur', 5000),
    ('Nasi Goreng', 'Extra Ayam', 10000),
    ('Nasi Goreng', 'Kerupuk', 3000),
    ('Ayam Goreng', 'Extra Nasi', 5000),
    ('Ayam Goreng', 'Sambal Extra', 3000),
    ('Mie Goreng', 'Extra Telur', 5000),
    ('Mie Goreng', 'Extra Sayur', 4000),
    ('Sate Ayam', 'Extra Lontong', 5000),
    ('Sate Ayam', 'Extra Bumbu Kacang', 3000),
    ('Rendang', 'Extra Nasi', 5000),
    ('Kopi Susu', 'Extra Shot', 5000),
    ('Kopi Susu', 'Whipped Cream', 4000),
    ('Es Buah', 'Extra Susu', 4000),
    ('Es Teh', 'Extra Es', 0),
    ('Jus Jeruk', 'Extra Madu', 5000),
    ('Bakso', 'Extra Mie', 4000),
    ('Bakso', 'Extra Bakso', 8000),
    ('Soto', 'Extra Nasi', 5000),
    ('Soto', 'Perkedel', 5000),
    ('Roti Bakar', 'Extra Keju', 5000),
    ('Roti Bakar', 'Extra Coklat', 4000),
    ('Martabak', 'Extra Telur', 5000),
    ('Martabak', 'Extra Keju', 7000)
) AS v(menu_name, addon_name, addon_price)
JOIN menus m ON m.name = v.menu_name
ON CONFLICT (menu_id, name) DO UPDATE
SET price = EXCLUDED.price, updated_at = NOW();

COMMIT;
