CREATE TABLE IF NOT EXISTS sticker_packs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stickers (
  id BIGSERIAL PRIMARY KEY,
  pack_id BIGINT NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sticker_packs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id BIGINT NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pack_id)
);

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sticker_id BIGINT REFERENCES stickers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stickers_pack_id ON stickers(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_sticker_packs_user_id ON user_sticker_packs(user_id);
