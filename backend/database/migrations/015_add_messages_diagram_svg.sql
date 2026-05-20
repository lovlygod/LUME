-- Add diagram_svg column to store pre-rendered SVG
ALTER TABLE messages ADD COLUMN IF NOT EXISTS diagram_svg TEXT;