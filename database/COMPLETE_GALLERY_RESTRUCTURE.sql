-- Complete Gallery Restructure for Event and Artist Galleries
-- Run these statements in order

-- Step 1: Add event_id to galleries table
ALTER TABLE galleries 
ADD COLUMN event_id INT NULL AFTER id;

-- Step 2: Add artist_id to galleries table (for artist-specific galleries)
ALTER TABLE galleries 
ADD COLUMN artist_id INT NULL AFTER event_id;

-- Step 3: Add indexes for performance
ALTER TABLE galleries 
ADD INDEX idx_event_id (event_id);

ALTER TABLE galleries 
ADD INDEX idx_artist_id (artist_id);

-- Step 4: Add gallery_type to distinguish different gallery types
ALTER TABLE galleries 
ADD COLUMN gallery_type ENUM('general', 'event', 'artist') DEFAULT 'general' AFTER title;

-- Step 5: Verify the changes
DESCRIBE galleries;

-- Step 6: Check current galleries
SELECT id, title, gallery_type, event_id, artist_id, image_count 
FROM galleries 
ORDER BY created_at DESC;

-- Now you can:
-- 1. Create event galleries (gallery_type='event', event_id=X)
-- 2. Create artist galleries (gallery_type='artist', artist_id=X)
-- 3. Keep general galleries (gallery_type='general')

