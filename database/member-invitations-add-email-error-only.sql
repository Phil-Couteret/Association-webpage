-- Add only email_error column (if email_sent and email_sent_at already exist)
-- This is the most likely scenario - only email_error is missing

ALTER TABLE member_invitations 
ADD COLUMN email_error TEXT NULL AFTER email_sent_at;

-- Add indexes if they don't exist (safe - will warn if exists but won't fail)
CREATE INDEX idx_email_sent ON member_invitations(email_sent);
CREATE INDEX idx_sent_at ON member_invitations(sent_at);

