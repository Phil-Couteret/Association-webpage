-- Gallery Images Table
-- This table stores images for the general gallery with categories and metadata

CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_filepath VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('events', 'artists', 'venue', 'community', 'other') DEFAULT 'other',
    width INT DEFAULT 0,
    height INT DEFAULT 0,
    file_size INT DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    INDEX idx_category (category),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_filename (filename),
    FULLTEXT idx_search (filename, description, alt_text)
);

-- Add some sample data (optional)
-- INSERT INTO gallery_images (filename, filepath, thumbnail_filepath, alt_text, description, category) VALUES
-- ('event_1.jpg', 'gallery-images/event_1.jpg', 'gallery-images/thumbnails/thumb_event_1.jpg', 'Electronic music event', 'Amazing night at the club', 'events'),
-- ('artist_1.jpg', 'gallery-images/artist_1.jpg', 'gallery-images/thumbnails/thumb_artist_1.jpg', 'DJ performing', 'Live performance', 'artists'),
-- ('venue_1.jpg', 'gallery-images/venue_1.jpg', 'gallery-images/thumbnails/thumb_venue_1.jpg', 'Club interior', 'Beautiful venue space', 'venue');

-- Create a view for easy querying of gallery images with categories
CREATE OR REPLACE VIEW gallery_images_view AS
SELECT 
    gi.*,
    CASE 
        WHEN gi.category = 'events' THEN 'Events'
        WHEN gi.category = 'artists' THEN 'Artists'
        WHEN gi.category = 'venue' THEN 'Venue'
        WHEN gi.category = 'community' THEN 'Community'
        WHEN gi.category = 'other' THEN 'Other'
    END as category_label
FROM gallery_images gi
ORDER BY gi.uploaded_at DESC;

-- Create a function to get images by category
DELIMITER //
CREATE FUNCTION GetGalleryImagesByCategory(category_name VARCHAR(50)) 
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    DECLARE file_path VARCHAR(500);
    DECLARE cur CURSOR FOR 
        SELECT filepath 
        FROM gallery_images 
        WHERE category = category_name 
        ORDER BY uploaded_at DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO file_path;
        IF done THEN
            LEAVE read_loop;
        END IF;
        IF result = '' THEN
            SET result = file_path;
        ELSE
            SET result = CONCAT(result, ',', file_path);
        END IF;
    END LOOP;
    CLOSE cur;
    
    RETURN result;
END//
DELIMITER ;

-- Create a function to get recent images
DELIMITER //
CREATE FUNCTION GetRecentGalleryImages(limit_count INT) 
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    DECLARE file_path VARCHAR(500);
    DECLARE cur CURSOR FOR 
        SELECT filepath 
        FROM gallery_images 
        ORDER BY uploaded_at DESC 
        LIMIT limit_count;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO file_path;
        IF done THEN
            LEAVE read_loop;
        END IF;
        IF result = '' THEN
            SET result = file_path;
        ELSE
            SET result = CONCAT(result, ',', file_path);
        END IF;
    END LOOP;
    CLOSE cur;
    
    RETURN result;
END//
DELIMITER ;
