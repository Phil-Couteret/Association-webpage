-- Add password field to members table for member login
-- Simple version: Only adds the password_hash column

ALTER TABLE members
ADD COLUMN password_hash VARCHAR(255) NULL AFTER email;

-- Note: The index idx_email already exists in your database, so we don't need to add it again.

