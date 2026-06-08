BEGIN;

-- Add subscription columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) NOT NULL DEFAULT 'inactive'
  CHECK (subscription_status IN ('active', 'inactive', 'expired', 'cancelled'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end ON users(subscription_end);

COMMIT;
