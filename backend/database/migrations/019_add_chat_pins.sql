BEGIN;

CREATE TABLE IF NOT EXISTS chat_pins (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chat_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_pins_chat_created
  ON chat_pins(chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_pins_message
  ON chat_pins(message_id);

COMMIT;

