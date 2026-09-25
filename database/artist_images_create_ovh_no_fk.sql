-- Create artist_images table WITHOUT foreign key constraint
-- Use this if the artists table doesn't exist yet
-- Database: elektry2025

USE elektry2025;

-- Create artist_images table with video support (no foreign key)
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

-- After creating the artists table, add the foreign key with:
-- ALTER TABLE artist_images 
-- ADD CONSTRAINT fk_artist_images_artist 
-- FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE;

