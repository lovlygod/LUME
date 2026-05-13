CREATE TABLE IF NOT EXISTS e2ee_encrypted_attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES e2ee_messages(id) ON DELETE SET NULL,
  sender_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_device_id TEXT NOT NULL,
  recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_device_id TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  mime_type TEXT,
  ciphertext_size BIGINT,
  sha256_ciphertext TEXT,
  encrypted_file_key TEXT NOT NULL,
  encrypted_file_nonce TEXT,
  protocol_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_e2ee_encrypted_attachments_recipient
  ON e2ee_encrypted_attachments(recipient_user_id, recipient_device_id, id);

CREATE INDEX IF NOT EXISTS idx_e2ee_encrypted_attachments_message
  ON e2ee_encrypted_attachments(message_id);
