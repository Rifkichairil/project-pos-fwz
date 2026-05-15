BEGIN;

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS pb1_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS pb1_rate NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (pb1_rate >= 0 AND pb1_rate <= 100),
  ADD COLUMN IF NOT EXISTS service_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS service_rate NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (service_rate >= 0 AND service_rate <= 100),
  ADD COLUMN IF NOT EXISTS ppn_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ppn_rate NUMERIC(5,2) NOT NULL DEFAULT 11 CHECK (ppn_rate >= 0 AND ppn_rate <= 100);

-- Remove old single tax columns if desired (keep for backward compat)
-- ALTER TABLE settings DROP COLUMN IF EXISTS tax_enabled;
-- ALTER TABLE settings DROP COLUMN IF EXISTS tax_rate;

UPDATE settings SET
  pb1_enabled = TRUE,
  pb1_rate = 10,
  service_enabled = TRUE,
  service_rate = 5,
  ppn_enabled = FALSE,
  ppn_rate = 11
WHERE id = 1;

COMMIT;
