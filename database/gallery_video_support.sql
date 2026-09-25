-- Add video support to gallery_images table
-- Run this on OVH database to enable video uploads for galleries

ALTER TABLE gallery_images 
ADD COLUMN media_type ENUM('image', 'video') DEFAULT 'image' AFTER category;

ALTER TABLE gallery_images 
ADD COLUMN video_duration INT NULL AFTER file_size;

-- Make thumbnail_filepath nullable for videos (videos might not have thumbnails initially)
ALTER TABLE gallery_images 
MODIFY COLUMN thumbnail_filepath VARCHAR(500) NULL;

-- Add index for media_type
ALTER TABLE gallery_images 
ADD INDEX idx_media_type (media_type);

