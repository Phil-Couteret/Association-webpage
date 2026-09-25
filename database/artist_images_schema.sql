-- Artist Images Table
-- This table stores multiple images for each artist with categories and metadata

CREATE TABLE IF NOT EXISTS artist_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    thumbnail_filepath VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('profile', 'stage', 'studio', 'fans', 'behind_scenes', 'other') DEFAULT 'other',
    is_profile_picture BOOLEAN DEFAULT FALSE,
    width INT DEFAULT 0,
    height INT DEFAULT 0,
    file_size INT DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_artist_id (artist_id),
    INDEX idx_category (category),
    INDEX idx_is_profile_picture (is_profile_picture),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Add some sample data (optional)
-- INSERT INTO artist_images (artist_id, filename, filepath, thumbnail_filepath, alt_text, description, category, is_profile_picture) VALUES
-- (1, 'profile_main.jpg', 'artist-images/profile_main.jpg', 'artist-images/thumbnails/thumb_profile_main.jpg', 'Main profile picture', 'Official profile photo', 'profile', TRUE),
-- (1, 'stage_performance.jpg', 'artist-images/stage_performance.jpg', 'artist-images/thumbnails/thumb_stage_performance.jpg', 'Live performance', 'Performing at Barcelona venue', 'stage', FALSE),
-- (1, 'studio_work.jpg', 'artist-images/studio_work.jpg', 'artist-images/thumbnails/thumb_studio_work.jpg', 'In the studio', 'Working on new track', 'studio', FALSE);

-- Update the artists table to include image count (optional)
-- ALTER TABLE artists ADD COLUMN image_count INT DEFAULT 0;

-- Create a view for easy querying of artist images with categories
CREATE OR REPLACE VIEW artist_images_view AS
SELECT 
    ai.*,
    a.name as artist_name,
    a.slug as artist_slug,
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

-- Create a function to get artist's profile picture
DELIMITER //
CREATE FUNCTION GetArtistProfilePicture(artist_id INT) 
RETURNS VARCHAR(500)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE profile_pic VARCHAR(500) DEFAULT NULL;
    
    SELECT filepath INTO profile_pic
    FROM artist_images 
    WHERE artist_id = artist_id 
    AND is_profile_picture = TRUE 
    LIMIT 1;
    
    RETURN profile_pic;
END//
DELIMITER ;

-- Create a function to get artist images by category
DELIMITER //
CREATE FUNCTION GetArtistImagesByCategory(artist_id INT, category_name VARCHAR(50)) 
RETURNS TEXT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result TEXT DEFAULT '';
    DECLARE done INT DEFAULT FALSE;
    DECLARE file_path VARCHAR(500);
    DECLARE cur CURSOR FOR 
        SELECT filepath 
        FROM artist_images 
        WHERE artist_id = artist_id 
        AND category = category_name 
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
