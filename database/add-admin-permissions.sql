-- Add granular section permissions for admin users
-- Run this migration before deploying the code changes.
-- Sections: events, artists, gallery, members, newsletter, email_automation, invitations, payment
-- Superadmin: full access (bypass). Admin: access based on JSON array.
ALTER TABLE admin_users
ADD COLUMN permissions JSON NULL COMMENT 'Array of section keys user can access' AFTER role;

-- Grant all 8 sections to existing admins (backward compatibility)
UPDATE admin_users
SET permissions = '["events","artists","gallery","members","newsletter","email_automation","invitations","payment"]'
WHERE role = 'admin' AND (permissions IS NULL OR permissions = '[]' OR permissions = 'null');
