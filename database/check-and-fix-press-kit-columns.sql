-- Check and add press-kit and streaming columns if they don't exist
-- This script is safe to run multiple times

-- Check if press_kit_url exists, if not add it
SET @db_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'artists' 
    AND COLUMN_NAME = 'press_kit_url'
);

SET @sql = IF(@db_exists = 0,
    'ALTER TABLE artists ADD COLUMN press_kit_url VARCHAR(500) NULL AFTER picture, ADD INDEX idx_press_kit_url (press_kit_url(255));',
    'SELECT "press_kit_url column already exists" AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if song columns exist, if not add them
SET @song1_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'artists' 
    AND COLUMN_NAME = 'song1_url'
);

SET @sql = IF(@song1_exists = 0,
    'ALTER TABLE artists 
     ADD COLUMN song1_url VARCHAR(500) NULL AFTER press_kit_url,
     ADD COLUMN song2_url VARCHAR(500) NULL AFTER song1_url,
     ADD COLUMN song3_url VARCHAR(500) NULL AFTER song2_url;',
    'SELECT "song columns already exist" AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if stream columns exist, if not add them
SET @stream1_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'artists' 
    AND COLUMN_NAME = 'stream1_url'
);

SET @sql = IF(@stream1_exists = 0,
    'ALTER TABLE artists 
     ADD COLUMN stream1_url VARCHAR(500) NULL AFTER song3_url,
     ADD COLUMN stream2_url VARCHAR(500) NULL AFTER stream1_url,
     ADD COLUMN stream3_url VARCHAR(500) NULL AFTER stream2_url;',
    'SELECT "stream columns already exist" AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Show final table structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'artists'
AND COLUMN_NAME IN ('press_kit_url', 'song1_url', 'song2_url', 'song3_url', 'stream1_url', 'stream2_url', 'stream3_url')
ORDER BY ORDINAL_POSITION;

