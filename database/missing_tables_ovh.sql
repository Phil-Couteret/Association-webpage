-- Create Missing Tables for OVH Production
-- Database: elektry2025
-- Run this in OVH phpMyAdmin

USE elektry2025;

-- ============================================
-- Create events table
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(255),
    capacity INT,
    price DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('draft', 'published', 'cancelled') DEFAULT 'draft',
    picture VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create galleries table
-- ============================================
CREATE TABLE IF NOT EXISTS galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_id INT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Create gallery_images table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gallery_id INT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_filepath VARCHAR(500) NULL,
    alt_text VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('events', 'artists', 'venue', 'community', 'other') DEFAULT 'other',
    width INT DEFAULT 0,
    height INT DEFAULT 0,
    file_size INT DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_gallery_id (gallery_id),
    INDEX idx_category (category),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Add foreign key constraints (optional)
-- ============================================
-- Note: These may fail if constraints already exist - that's okay, just skip them
-- 
-- Add foreign key for gallery_images -> galleries
-- Run this AFTER both tables are created:
-- ALTER TABLE gallery_images 
-- ADD CONSTRAINT fk_gallery_images_gallery 
-- FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE SET NULL;
--
-- Add foreign key for galleries -> gallery_images (cover_image_id)
-- Run this AFTER both tables are created:
-- ALTER TABLE galleries 
-- ADD CONSTRAINT fk_galleries_cover_image 
-- FOREIGN KEY (cover_image_id) REFERENCES gallery_images(id) ON DELETE SET NULL;

-- ============================================
-- Verify tables were created
-- ============================================
-- Run this to verify:
-- SHOW TABLES;
-- DESCRIBE events;
-- DESCRIBE galleries;
-- DESCRIBE gallery_images;

