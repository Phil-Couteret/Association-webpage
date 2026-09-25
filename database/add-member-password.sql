-- Add password field to members table for member login

ALTER TABLE members
ADD COLUMN password_hash VARCHAR(255) NULL AFTER email,
ADD INDEX idx_email (email);

-- Note: Existing members will have NULL passwords
-- They can set passwords via "Forgot Password" or admin can set for them

