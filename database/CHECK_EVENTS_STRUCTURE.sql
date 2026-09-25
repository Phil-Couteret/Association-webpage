-- Check events table structure
DESCRIBE events;

-- Check existing statuses
SELECT DISTINCT status FROM events;

-- Check sample events with dates
SELECT id, title, date, time, status, created_at 
FROM events 
ORDER BY date DESC 
LIMIT 10;

