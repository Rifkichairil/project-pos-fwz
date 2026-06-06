-- Add image_url column to menus table for menu photos
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_url TEXT;
