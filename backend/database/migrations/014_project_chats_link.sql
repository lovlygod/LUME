-- Migration 014: Add project_id to chats table (if not exists)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);