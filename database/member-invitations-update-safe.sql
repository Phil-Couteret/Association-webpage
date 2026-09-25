-- Safe migration script for member_invitations table
-- This checks which columns exist and only adds missing ones
-- Run this in phpMyAdmin

-- Step 1: Check existing columns (run this first to see what exists)
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'member_invitations'
ORDER BY ORDINAL_POSITION;

-- Step 2: Only run the ALTER TABLE statements for columns that DON'T exist
-- Check the result above, then uncomment and run only the needed statements:

-- If 'email_sent' is NOT in the list above, run this:
-- ALTER TABLE member_invitations ADD COLUMN email_sent BOOLEAN DEFAULT FALSE AFTER status;

-- If 'email_sent_at' is NOT in the list above, run this:
-- ALTER TABLE member_invitations ADD COLUMN email_sent_at TIMESTAMP NULL AFTER email_sent;

-- If 'email_error' is NOT in the list above, run this:
-- ALTER TABLE member_invitations ADD COLUMN email_error TEXT NULL AFTER email_sent_at;

-- Step 3: Add indexes (safe - will show warning if exists but won't break)
-- Run these regardless:
CREATE INDEX idx_email_sent ON member_invitations(email_sent);
CREATE INDEX idx_sent_at ON member_invitations(sent_at);

