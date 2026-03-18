-- LUME PostgreSQL schema

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  city TEXT,
  website TEXT,
  pinned_post_id BIGINT,
  avatar TEXT,
  banner TEXT,
  verified INTEGER DEFAULT 0,
  is_verified INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  verification_expiry TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  replies_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  resonance_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS followers (
  id BIGSERIAL PRIMARY KEY,
  follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('private', 'group', 'channel')),
  title TEXT,
  avatar TEXT,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  username TEXT UNIQUE,
  invite_token TEXT UNIQUE,
  public_number BIGINT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  type TEXT DEFAULT 'text',
  reply_to_message_id BIGINT,
  link_preview TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_status INTEGER DEFAULT 0,
  deleted_for_all_at TIMESTAMPTZ,
  deleted_for_all_by BIGINT
);

CREATE TABLE IF NOT EXISTS message_deletions (
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
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

CREATE TABLE IF NOT EXISTS attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  mime TEXT NOT NULL,
  size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  city TEXT,
  country TEXT,
  region TEXT,
  provider TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip_geo_cache (
  ip TEXT PRIMARY KEY,
  city TEXT,
  country TEXT,
  region TEXT,
  provider TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (ip, action)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id BIGINT,
  target_id BIGINT,
  target_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  actor_username TEXT,
  actor_avatar TEXT,
  target_id BIGINT,
  target_type TEXT,
  message TEXT,
  url TEXT,
  read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  tiktok_video_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id BIGINT,
  review_notes TEXT
);

CREATE TABLE IF NOT EXISTS post_reports (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_id BIGINT,
  review_notes TEXT
);

CREATE TABLE IF NOT EXISTS link_previews (
  url_hash TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moments (
  id BIGSERIAL PRIMARY KEY,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime TEXT,
  size BIGINT,
  width INTEGER,
  height INTEGER,
  thumb_data_url TEXT,
  ttl_seconds INTEGER,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moment_tokens (
  id BIGSERIAL PRIMARY KEY,
  moment_id BIGINT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS moment_views (
  moment_id BIGINT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (moment_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_reads (
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS servers (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  type TEXT NOT NULL DEFAULT 'public',
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_roles (
  id BIGSERIAL PRIMARY KEY,
  server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0,
  permissions_json TEXT,
  is_system INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS server_members (
  id BIGSERIAL PRIMARY KEY,
  server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT REFERENCES server_roles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (server_id, user_id)
);

CREATE TABLE IF NOT EXISTS server_channels (
  id BIGSERIAL PRIMARY KEY,
  server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  position INTEGER DEFAULT 0,
  UNIQUE (server_id, name)
);

CREATE TABLE IF NOT EXISTS server_join_requests (
  id BIGSERIAL PRIMARY KEY,
  server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by BIGINT
);

CREATE TABLE IF NOT EXISTS server_bans (
  id BIGSERIAL PRIMARY KEY,
  server_id BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (server_id, user_id)
);

CREATE TABLE IF NOT EXISTS server_messages (
  id BIGSERIAL PRIMARY KEY,
  channel_id BIGINT NOT NULL REFERENCES server_channels(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  reply_to_message_id BIGINT,
  link_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS server_message_attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  mime TEXT,
  size BIGINT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_message_deletions (
  message_id BIGINT NOT NULL REFERENCES server_messages(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

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

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_messages_channel_id ON server_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_developer_apps_user_id ON developer_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_app_id ON developer_api_keys(app_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_usage_app_id ON developer_api_usage(app_id);
CREATE INDEX IF NOT EXISTS idx_developer_api_usage_timestamp ON developer_api_usage(timestamp);
