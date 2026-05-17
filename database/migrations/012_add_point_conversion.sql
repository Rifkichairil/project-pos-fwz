BEGIN;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS point_value NUMERIC(14,2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS point_per_rupiah NUMERIC(14,2) NOT NULL DEFAULT 1000;

-- Default: 1 point per 1000 rupiah
UPDATE settings SET point_value = 1, point_per_rupiah = 1000 WHERE id = 1;

COMMIT;
