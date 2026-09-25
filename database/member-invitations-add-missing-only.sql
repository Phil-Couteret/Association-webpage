-- Add only the missing columns (run this after checking what exists)
-- If email_sent already exists, skip the first ALTER TABLE
-- If email_sent_at already exists, skip the second ALTER TABLE  
-- If email_error already exists, skip the third ALTER TABLE

-- Add email_sent_at if email_sent exists but email_sent_at doesn't
ALTER TABLE member_invitations 
ADD COLUMN email_sent_at TIMESTAMP NULL AFTER email_sent;

-- Add email_error if it doesn't exist
ALTER TABLE member_invitations 
ADD COLUMN email_error TEXT NULL AFTER email_sent_at;

-- Add indexes (will show warning if exists, but safe to run)
CREATE INDEX idx_email_sent ON member_invitations(email_sent);
CREATE INDEX idx_sent_at ON member_invitations(sent_at);

