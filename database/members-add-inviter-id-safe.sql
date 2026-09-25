-- Safe migration: Add inviter_id column to members table (only if missing)
-- This links members to the person who invited them

-- Check and add column if it doesn't exist
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'members' 
AND COLUMN_NAME = 'inviter_id';

-- Add column if missing
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE members ADD COLUMN inviter_id INT NULL AFTER country',
    'SELECT "Column inviter_id already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index (safe - will show warning if exists but won't fail)
CREATE INDEX IF NOT EXISTS idx_inviter_id ON members(inviter_id);

-- Check if foreign key exists
SELECT COUNT(*) INTO @fk_exists
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'members' 
AND CONSTRAINT_NAME LIKE '%inviter_id%'
AND REFERENCED_TABLE_NAME = 'members';

-- Add foreign key if missing
SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE members ADD CONSTRAINT members_ibfk_inviter_id FOREIGN KEY (inviter_id) REFERENCES members(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists - skipping" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

