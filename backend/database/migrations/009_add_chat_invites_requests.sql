-- Add invite links, public numbers, and join requests for chats/channels

ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS public_number BIGINT UNIQUE;

CREATE TABLE IF NOT EXISTS chat_join_requests (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_join_requests_chat_id ON chat_join_requests(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_join_requests_user_id ON chat_join_requests(user_id);
