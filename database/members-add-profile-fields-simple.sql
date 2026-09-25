-- Add profile enhancement fields to members table
-- Profile picture, social links, and bio
-- Simple version - run each ALTER TABLE separately
-- If column already exists, you'll get an error which you can ignore

-- Add profile_picture column
ALTER TABLE members
ADD COLUMN profile_picture VARCHAR(500) NULL AFTER artist_name;

-- Add bio column
ALTER TABLE members
ADD COLUMN bio TEXT NULL AFTER profile_picture;

-- Add social_links column
ALTER TABLE members
ADD COLUMN social_links JSON NULL AFTER bio;

-- Add index for profile picture
CREATE INDEX idx_profile_picture ON members (profile_picture(255));

