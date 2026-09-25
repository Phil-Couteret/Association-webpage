-- Check if inviter_id column and related indexes/constraints exist
-- This is a diagnostic query to see current state

SELECT 
    'Column Check' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END AS status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'members' 
AND COLUMN_NAME = 'inviter_id'

UNION ALL

SELECT 
    'Index Check' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END AS status
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'members' 
AND INDEX_NAME = 'idx_inviter_id'

UNION ALL

SELECT 
    'Foreign Key Check' AS check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'MISSING'
    END AS status
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'members' 
AND CONSTRAINT_NAME LIKE '%inviter_id%'
AND REFERENCED_TABLE_NAME = 'members';

