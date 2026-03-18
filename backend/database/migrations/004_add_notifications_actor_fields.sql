ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS entity_id BIGINT;

UPDATE notifications
SET entity_id = COALESCE(target_id, actor_id, user_id)
WHERE entity_id IS NULL;

ALTER TABLE notifications
  ALTER COLUMN entity_id SET NOT NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_username TEXT,
  ADD COLUMN IF NOT EXISTS actor_avatar TEXT,
  ADD COLUMN IF NOT EXISTS target_id BIGINT,
  ADD COLUMN IF NOT EXISTS target_type TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT;
