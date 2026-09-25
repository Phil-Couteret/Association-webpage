-- Complete Setup for OVH Production
-- Run these SQL statements in order
-- Database: elektry2025

USE elektry2025;

-- ============================================
-- STEP 1: Check what tables exist
-- ============================================
-- Run this first to see what you have:
-- SHOW TABLES;

-- ============================================
-- STEP 2: Create artists table (if needed)
-- ============================================
CREATE TABLE IF NOT EXISTS artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) NULL,
    bio TEXT,
    bio_key VARCHAR(255) NULL,
    genre VARCHAR(100),
    website VARCHAR(255),
    social_media JSON,
    picture VARCHAR(500) NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 3: Create artist_images table
-- ============================================
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
    
    INDEX idx_artist_id (artist_id),
    INDEX idx_category (category),
    INDEX idx_media_type (media_type),
    INDEX idx_is_profile_picture (is_profile_picture),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STEP 4: Add foreign key constraint
-- ============================================
-- Only run this AFTER both tables exist
-- Check if constraint already exists first
ALTER TABLE artist_images 
ADD CONSTRAINT fk_artist_images_artist 
FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;

-- ============================================
-- STEP 5: Verify tables were created
-- ============================================
-- Run this to verify:
-- SHOW TABLES;
-- DESCRIBE artist_images;
-- DESCRIBE artists;

