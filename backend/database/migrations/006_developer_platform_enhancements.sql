-- Developer Platform enhancements

CREATE TABLE IF NOT EXISTS developer_app_events (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developer_api_key_events (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
  api_key_id BIGINT REFERENCES developer_api_keys(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developer_api_key_status (
  api_key_id BIGINT PRIMARY KEY REFERENCES developer_api_keys(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  compromised_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS developer_api_request_logs (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES developer_apps(id) ON DELETE CASCADE,
  api_key_id BIGINT REFERENCES developer_api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS developer_incidents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'investigating',
  severity TEXT NOT NULL DEFAULT 'minor',
  description TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dev_app_events_app_id ON developer_app_events(app_id);
CREATE INDEX IF NOT EXISTS idx_dev_key_events_app_id ON developer_api_key_events(app_id);
CREATE INDEX IF NOT EXISTS idx_dev_key_events_key_id ON developer_api_key_events(api_key_id);
CREATE INDEX IF NOT EXISTS idx_dev_req_logs_app_id ON developer_api_request_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_dev_req_logs_created_at ON developer_api_request_logs(created_at);
