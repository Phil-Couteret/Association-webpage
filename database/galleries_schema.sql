-- Galleries Table
-- This table stores gallery collections with titles and descriptions

CREATE TABLE IF NOT EXISTS galleries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_id INT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
);

-- Add gallery_id column to gallery_images table
-- This migration adds the foreign key relationship
ALTER TABLE gallery_images 
ADD COLUMN gallery_id INT NULL AFTER id,
ADD INDEX idx_gallery_id (gallery_id),
ADD CONSTRAINT fk_gallery_images_gallery 
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE SET NULL;

-- Update existing images to have NULL gallery_id (they'll be in "Uncategorized" or can be assigned later)
-- This is safe to run even if column already exists

