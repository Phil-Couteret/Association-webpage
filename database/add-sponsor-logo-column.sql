-- Add logo_url to sponsor_donations for company logo display in communications
ALTER TABLE sponsor_donations
ADD COLUMN logo_url VARCHAR(500) NULL AFTER message;
