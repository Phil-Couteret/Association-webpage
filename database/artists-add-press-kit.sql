-- Add press_kit_url field to artists table
-- This can store either a URL or a file path to the press-kit document

ALTER TABLE artists
ADD COLUMN press_kit_url VARCHAR(500) NULL AFTER picture,
ADD INDEX idx_press_kit_url (press_kit_url(255));

