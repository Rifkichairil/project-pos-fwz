-- Add min_stock column to ingredients table
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS min_stock NUMERIC(14,2) NOT NULL DEFAULT 0;
