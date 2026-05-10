BEGIN;

CREATE TABLE IF NOT EXISTS dining_tables (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  capacity INT NOT NULL CHECK (capacity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dining_tables_status ON dining_tables(status);
CREATE INDEX IF NOT EXISTS idx_dining_tables_is_active ON dining_tables(is_active);

INSERT INTO dining_tables (name, capacity, status)
VALUES
  ('Table 1A', 4, 'available'),
  ('Table 1B', 4, 'occupied'),
  ('Table 2A', 6, 'available'),
  ('Table 2B', 6, 'reserved'),
  ('Table 3A', 2, 'available'),
  ('Table 3B', 2, 'occupied'),
  ('Table 4A', 8, 'available'),
  ('Table 4B', 8, 'cleaning')
ON CONFLICT (name) DO NOTHING;

COMMIT;
