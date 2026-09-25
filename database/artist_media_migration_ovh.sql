-- Migration: Add video support to artist_images table
-- OVH Production Version (uses elektry2025 database)
-- Run this in OVH phpMyAdmin

USE elektry2025;

-- Add media_type column to artist_images table
-- Note: Remove IF NOT EXISTS if your MySQL version doesn't support it
ALTER TABLE artist_images 
ADD COLUMN media_type ENUM('image', 'video') DEFAULT 'image' AFTER category;

-- Add video_duration column for videos (in seconds)
ALTER TABLE artist_images 
ADD COLUMN video_duration INT NULL AFTER file_size;

-- Update thumbnail_filepath to be nullable for videos (videos might not have thumbnails initially)
ALTER TABLE artist_images 
MODIFY COLUMN thumbnail_filepath VARCHAR(500) NULL;

-- Add index for media_type
ALTER TABLE artist_images 
ADD INDEX idx_media_type (media_type);

-- Note: The view update is optional and may fail if the view doesn't exist
-- You can skip this if the view doesn't exist yet
DROP VIEW IF EXISTS artist_images_view;

CREATE OR REPLACE VIEW artist_images_view AS
SELECT 
    ai.*,
    a.name as artist_name,
    CASE 
        WHEN ai.category = 'profile' THEN 'Profile Picture'
        WHEN ai.category = 'stage' THEN 'On Stage'
        WHEN ai.category = 'studio' THEN 'In Studio'
        WHEN ai.category = 'fans' THEN 'With Fans'
        WHEN ai.category = 'behind_scenes' THEN 'Behind the Scenes'
        WHEN ai.category = 'other' THEN 'Other'
    END as category_label
FROM artist_images ai
JOIN artists a ON ai.artist_id = a.id
ORDER BY ai.uploaded_at DESC;

