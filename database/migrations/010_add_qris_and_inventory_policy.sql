BEGIN;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS qris_image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inventory_policy VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (inventory_policy IN ('strict', 'medium', 'off'));

UPDATE settings SET inventory_policy = 'medium' WHERE id = 1;

COMMIT;
