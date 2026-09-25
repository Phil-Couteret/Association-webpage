-- Update artists table to add missing columns for OVH
-- Run this if artists table exists but is missing columns

USE elektry2025;

-- Check current structure first:
-- DESCRIBE artists;

-- Add missing columns (safe to run even if they exist - will show error but won't break)
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(255) NULL AFTER name,
ADD COLUMN IF NOT EXISTS bio_key VARCHAR(255) NULL AFTER bio,
ADD COLUMN IF NOT EXISTS picture VARCHAR(500) NULL AFTER website;

-- Note: If "IF NOT EXISTS" is not supported, check columns first:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = 'elektry2025' AND TABLE_NAME = 'artists';

