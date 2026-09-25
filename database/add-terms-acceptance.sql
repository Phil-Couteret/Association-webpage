-- Add terms acceptance columns for official membership (Spanish association requirements)
-- Run in phpMyAdmin before deploying the terms acceptance feature.
-- If columns already exist, this will fail - that's OK.

ALTER TABLE members
ADD COLUMN terms_accepted_at DATETIME NULL DEFAULT NULL,
ADD COLUMN terms_version VARCHAR(20) NULL DEFAULT NULL;
