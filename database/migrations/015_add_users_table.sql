BEGIN;

-- Add phone column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

-- Seed some users
INSERT INTO users (fullname, username, email, password, phone, role)
VALUES
  ('Jennie Doe', 'jennie', 'jenniedoe@gmail.com', 'admin123', '0812-0000-0001', 'admin'),
  ('Budi Kasir', 'budi', 'budi.kasir@warungkita.com', 'kasir123', '0812-0000-0002', 'cashier'),
  ('Rudi Manager', 'rudi', 'rudi.mgr@warungkita.com', 'manager123', '0812-0000-0003', 'manager')
ON CONFLICT (email) DO UPDATE SET
  fullname = EXCLUDED.fullname,
  username = EXCLUDED.username,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_active = TRUE,
  updated_at = NOW();

COMMIT;
