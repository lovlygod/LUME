-- Developer Platform tables

CREATE TABLE IF NOT EXISTS developer_apps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  client_id TEXT NOT NULL UNIQUE,
  client_secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developer_api_keys (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS developer_api_usage (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  ip TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developer_apps_user_id ON developer_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_app_id ON developer_api_keys(app_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_usage_app_id ON developer_api_usage(app_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_usage_timestamp ON developer_api_usage(timestamp);
