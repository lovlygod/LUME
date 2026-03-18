-- Replace servers module with chat-first model

-- 1) Drop server-related tables
DROP TABLE IF EXISTS server_message_deletions;
DROP TABLE IF EXISTS server_message_attachments;
DROP TABLE IF EXISTS server_messages;
DROP TABLE IF EXISTS server_bans;
DROP TABLE IF EXISTS server_join_requests;
DROP TABLE IF EXISTS server_channels;
DROP TABLE IF EXISTS server_members;
DROP TABLE IF EXISTS server_roles;
DROP TABLE IF EXISTS servers;

-- 2) Replace chats table with chat-first model
DROP TABLE IF EXISTS chat_reads;
DROP TABLE IF EXISTS chats;

CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('private', 'group', 'channel')),
  title TEXT,
  avatar TEXT,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_members (
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_reads (
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- 3) Update messages table to chat-scoped model
ALTER TABLE messages
  DROP COLUMN IF EXISTS receiver_id;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE;

ALTER TABLE messages
  ALTER COLUMN created_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
