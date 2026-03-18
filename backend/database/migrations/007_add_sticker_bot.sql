ALTER TABLE sticker_packs
ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sticker_packs_slug ON sticker_packs(slug);

CREATE TABLE IF NOT EXISTS sticker_bot_sessions (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  step TEXT NOT NULL DEFAULT 'idle',
  pack_name TEXT,
  stickers_temp TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
