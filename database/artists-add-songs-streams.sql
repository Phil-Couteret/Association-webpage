-- Add song and stream URL fields to artists table
-- Each artist can have up to 3 songs and 3 streams

ALTER TABLE artists
ADD COLUMN song1_url VARCHAR(500) NULL AFTER press_kit_url,
ADD COLUMN song2_url VARCHAR(500) NULL AFTER song1_url,
ADD COLUMN song3_url VARCHAR(500) NULL AFTER song2_url,
ADD COLUMN stream1_url VARCHAR(500) NULL AFTER song3_url,
ADD COLUMN stream2_url VARCHAR(500) NULL AFTER stream1_url,
ADD COLUMN stream3_url VARCHAR(500) NULL AFTER stream2_url,
ADD INDEX idx_songs (song1_url(255), song2_url(255), song3_url(255)),
ADD INDEX idx_streams (stream1_url(255), stream2_url(255), stream3_url(255));

