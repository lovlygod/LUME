-- Add application role for admin checks and profile responses.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

UPDATE users SET role = 'user' WHERE role IS NULL;
