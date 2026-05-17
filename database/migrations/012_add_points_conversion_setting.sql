BEGIN;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS points_per_amount INTEGER NOT NULL DEFAULT 10000,
  ADD COLUMN IF NOT EXISTS points_earned INTEGER NOT NULL DEFAULT 1;

-- Default: setiap Rp. 10.000 = 1 poin
UPDATE settings SET points_per_amount = 10000, points_earned = 1 WHERE id = 1;

COMMIT;
