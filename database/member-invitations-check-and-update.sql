-- Safe migration: Check what columns exist and only add missing ones
-- Run this in phpMyAdmin - it will show you what needs to be added

-- First, check what columns exist
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'member_invitations'
ORDER BY ORDINAL_POSITION;

-- Then run only the ALTER TABLE statements for columns that don't exist
-- Uncomment the ones you need:

-- If email_sent doesn't exist:
-- ALTER TABLE member_invitations ADD COLUMN email_sent BOOLEAN DEFAULT FALSE AFTER status;

-- If email_sent_at doesn't exist:
-- ALTER TABLE member_invitations ADD COLUMN email_sent_at TIMESTAMP NULL AFTER email_sent;

-- If email_error doesn't exist:
-- ALTER TABLE member_invitations ADD COLUMN email_error TEXT NULL AFTER email_sent_at;

-- Add indexes (safe to run multiple times - will show warning if exists but won't fail):
-- CREATE INDEX idx_email_sent ON member_invitations(email_sent);
-- CREATE INDEX idx_sent_at ON member_invitations(sent_at);

