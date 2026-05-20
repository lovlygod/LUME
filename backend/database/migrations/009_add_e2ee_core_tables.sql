CREATE TABLE IF NOT EXISTS e2ee_devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  identity_key TEXT NOT NULL,
  identity_key_algo TEXT NOT NULL DEFAULT 'x25519',
  signed_prekey_id INTEGER NOT NULL,
  signed_prekey_public TEXT NOT NULL,
  signed_prekey_signature TEXT NOT NULL,
  signed_prekey_algo TEXT NOT NULL DEFAULT 'x25519',
  registration_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, device_id)
);

CREATE TABLE IF NOT EXISTS e2ee_one_time_prekeys (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  prekey_id INTEGER NOT NULL,
  public_key TEXT NOT NULL,
  key_algo TEXT NOT NULL DEFAULT 'x25519',
  used_at TIMESTAMPTZ,
  used_by_user_id BIGINT,
  used_by_device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_id, prekey_id)
);

CREATE TABLE IF NOT EXISTS e2ee_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_device_id TEXT NOT NULL,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_device_id TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'ciphertext',
  protocol_version INTEGER NOT NULL DEFAULT 1,
  envelope_json TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_e2ee_devices_user_id ON e2ee_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_e2ee_messages_chat_id ON e2ee_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_e2ee_messages_recipient ON e2ee_messages(recipient_user_id, recipient_device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_e2ee_one_time_prekeys_lookup ON e2ee_one_time_prekeys(user_id, device_id, used_at, prekey_id);
