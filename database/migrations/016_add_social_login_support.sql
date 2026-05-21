BEGIN;

ALTER TABLE users
  ALTER COLUMN password DROP NOT NULL;

CREATE TABLE IF NOT EXISTS user_social_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google')),
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(160),
  provider_avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_social_accounts_user_id
  ON user_social_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_user_social_accounts_provider
  ON user_social_accounts(provider);

COMMIT;
