CREATE TABLE IF NOT EXISTS e2ee_device_trust (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verifier_device_id TEXT NOT NULL,
  target_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_device_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('trusted', 'untrusted')),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, verifier_device_id, target_user_id, target_device_id)
);

CREATE INDEX IF NOT EXISTS idx_e2ee_device_trust_user_device
  ON e2ee_device_trust(user_id, verifier_device_id);

CREATE INDEX IF NOT EXISTS idx_e2ee_device_trust_target
  ON e2ee_device_trust(target_user_id, target_device_id);
