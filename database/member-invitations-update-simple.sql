-- Simple version: Only add columns that don't exist
-- This version uses a simpler approach that works in phpMyAdmin

-- Add email_sent column if it doesn't exist
ALTER TABLE member_invitations
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE AFTER status;

-- Add email_sent_at column if it doesn't exist  
ALTER TABLE member_invitations
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP NULL AFTER email_sent;

-- Add email_error column if it doesn't exist
ALTER TABLE member_invitations
ADD COLUMN IF NOT EXISTS email_error TEXT NULL AFTER email_sent_at;

-- Add indexes (will fail silently if they exist)
CREATE INDEX idx_email_sent ON member_invitations(email_sent);
CREATE INDEX idx_sent_at ON member_invitations(sent_at);

