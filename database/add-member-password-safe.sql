-- Add password field to members table for member login
-- Safe version: Only adds column if it doesn't exist, skips index if exists

-- Add password_hash column (will fail gracefully if it already exists)
ALTER TABLE members
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER email;

-- Note: Index idx_email already exists, so we skip adding it
-- If you need to verify the index exists, run:
-- SHOW INDEX FROM members WHERE Key_name = 'idx_email';

