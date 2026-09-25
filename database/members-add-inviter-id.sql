-- Add inviter_id column to members table (if it doesn't exist)
-- This links members to the person who invited them

-- Check if column exists and add it if not
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'members' 
    AND COLUMN_NAME = 'inviter_id'
);

-- Add column if it doesn't exist
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE members ADD COLUMN inviter_id INT NULL AFTER country',
    'SELECT "Column inviter_id already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_inviter_id ON members(inviter_id);

-- Add foreign key if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS for foreign keys, so we check first
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'members' 
    AND CONSTRAINT_NAME = 'members_ibfk_inviter_id'
    AND REFERENCED_TABLE_NAME = 'members'
);

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE members ADD CONSTRAINT members_ibfk_inviter_id FOREIGN KEY (inviter_id) REFERENCES members(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

