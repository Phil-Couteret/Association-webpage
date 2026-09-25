-- Link Galleries to Events
-- This allows creating one gallery per event (or multiple galleries per event)

-- Add event_id column to galleries table
ALTER TABLE galleries 
ADD COLUMN event_id INT NULL AFTER id;

-- Add index for faster queries
ALTER TABLE galleries 
ADD INDEX idx_event_id (event_id);

-- Optional: Add foreign key constraint (run separately if the first one succeeds)
-- ALTER TABLE galleries 
-- ADD CONSTRAINT fk_galleries_event 
-- FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Verify the change
DESCRIBE galleries;

-- Now you can:
-- 1. Create galleries linked to events
-- 2. Query galleries by event_id
-- 3. Display event galleries separately from general galleries

