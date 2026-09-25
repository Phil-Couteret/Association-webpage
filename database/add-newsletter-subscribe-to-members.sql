-- Add newsletter_subscribe to members table
-- Tracks whether member opted in to newsletter during registration (separate from newsletter_subscribers)
-- Default 1 = ticked by default for new registrations

ALTER TABLE members
ADD COLUMN newsletter_subscribe TINYINT(1) NOT NULL DEFAULT 0
COMMENT '1=opted in to newsletter, 0=opted out'
AFTER is_fan;

-- Existing members default to 0 (not subscribed) since they didn't explicitly opt in
