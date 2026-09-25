-- Final check and add only what's missing
-- Run this to see what columns exist, then add only what's needed

-- Step 1: Check what columns currently exist
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'member_invitations'
  AND COLUMN_NAME IN ('email_sent', 'email_sent_at', 'email_error')
ORDER BY ORDINAL_POSITION;

-- Step 2: Based on the results above, run only what's missing:

-- If 'email_error' is NOT in the results, run this:
ALTER TABLE member_invitations 
ADD COLUMN email_error TEXT NULL AFTER email_sent_at;

-- Step 3: Add indexes (safe to run - will show warning if exists but won't fail)
-- Check if indexes exist first:
SHOW INDEXES FROM member_invitations WHERE Key_name IN ('idx_email_sent', 'idx_sent_at');

-- Then add indexes if they don't exist (uncomment if needed):
-- CREATE INDEX idx_email_sent ON member_invitations(email_sent);
-- CREATE INDEX idx_sent_at ON member_invitations(sent_at);

