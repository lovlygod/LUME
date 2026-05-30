BEGIN;

CREATE TABLE IF NOT EXISTS wallet_e2ee_messages (
  id BIGSERIAL PRIMARY KEY,
  tx_id BIGINT NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_device_id TEXT NOT NULL,
  protocol_version INT NOT NULL DEFAULT 1,
  cipher_alg TEXT NOT NULL DEFAULT 'xchacha20poly1305',
  aad_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ciphertext_b64 TEXT NOT NULL,
  nonce_b64 TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  client_operation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_id),
  UNIQUE (client_operation_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_e2ee_messages_recipient_created
  ON wallet_e2ee_messages(recipient_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wallet_e2ee_envelopes (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES wallet_e2ee_messages(id) ON DELETE CASCADE,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_device_id TEXT NOT NULL,
  wrapped_key_b64 TEXT NOT NULL,
  wrap_alg TEXT NOT NULL DEFAULT 'x25519-hkdf',
  envelope_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMPTZ,
  decrypted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, recipient_user_id, recipient_device_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_e2ee_envelopes_recipient_device
  ON wallet_e2ee_envelopes(recipient_user_id, recipient_device_id, id DESC);

CREATE TABLE IF NOT EXISTS wallet_e2ee_replay_guard (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_device_id TEXT NOT NULL,
  client_operation_id TEXT NOT NULL,
  nonce_b64 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (actor_user_id, sender_device_id, client_operation_id),
  UNIQUE (actor_user_id, sender_device_id, nonce_b64)
);

COMMIT;

