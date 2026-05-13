ALTER TABLE e2ee_messages
  ADD COLUMN IF NOT EXISTS client_message_id TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_e2ee_sender_device_client_msg
  ON e2ee_messages(sender_user_id, sender_device_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_e2ee_messages_sync_cursor
  ON e2ee_messages(recipient_user_id, recipient_device_id, id);
