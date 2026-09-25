-- Add bio_translations column to artists table
-- This will store Spanish and Catalan translations as JSON

ALTER TABLE artists 
ADD COLUMN bio_translations JSON NULL AFTER bio_key;

-- Add an index for better performance
ALTER TABLE artists 
ADD INDEX idx_bio_translations (bio_translations((255)));

-- Verify the change
DESCRIBE artists;

