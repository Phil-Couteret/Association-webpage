-- Create artist_images table for OVH Production
-- This includes video support columns from the start
-- Database: elektry2025
-- Run this in OVH phpMyAdmin
-- 
-- IMPORTANT: Make sure the 'artists' table exists first!
-- If artists table doesn't exist, run the artists table creation first,
-- or remove the FOREIGN KEY line temporarily.

USE elektry2025;

-- Step 1: Check if artists table exists
-- Run this first to verify:
-- SHOW TABLES LIKE 'artists';

-- Step 2: Create artist_images table with video support
-- Remove the FOREIGN KEY line if artists table doesn't exist yet
CREATE TABLE IF NOT EXISTS artist_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_filepath VARCHAR(500) NULL,
    alt_text VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('profile', 'stage', 'studio', 'fans', 'behind_scenes', 'other') DEFAULT 'other',
    media_type ENUM('image', 'video') DEFAULT 'image',
    is_profile_picture BOOLEAN DEFAULT FALSE,
    width INT DEFAULT 0,
    height INT DEFAULT 0,
    file_size INT DEFAULT 0,
    video_duration INT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_artist_id (artist_id),
    INDEX idx_category (category),
    INDEX idx_media_type (media_type),
    INDEX idx_is_profile_picture (is_profile_picture),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Add foreign key constraint AFTER artists table is created
-- Run this separately once artists table exists:
-- ALTER TABLE artist_images 
-- ADD CONSTRAINT fk_artist_images_artist 
-- FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;

