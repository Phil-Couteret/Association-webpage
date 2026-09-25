-- Add nickname/artist name and role fields to members table

ALTER TABLE members
ADD COLUMN artist_name VARCHAR(100) NULL AFTER second_name,
ADD COLUMN is_dj BOOLEAN DEFAULT FALSE AFTER country,
ADD COLUMN is_producer BOOLEAN DEFAULT FALSE AFTER is_dj,
ADD COLUMN is_vj BOOLEAN DEFAULT FALSE AFTER is_producer,
ADD COLUMN is_visual_artist BOOLEAN DEFAULT FALSE AFTER is_vj,
ADD COLUMN is_fan BOOLEAN DEFAULT FALSE AFTER is_visual_artist;

-- Add index for searching by artist name
CREATE INDEX idx_artist_name ON members (artist_name);






