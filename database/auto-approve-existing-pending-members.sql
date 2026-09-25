-- One-time migration: approve existing members stuck in pending status.
-- Run manually on production after deploying auto-approval on registration.
-- Safe to re-run (only affects pending + email-verified members).

UPDATE members
SET status = 'approved', updated_at = NOW()
WHERE status = 'pending'
  AND email_verified = 1;

-- Mark related invitations as approved for those members
UPDATE member_invitations mi
JOIN members m ON m.id = mi.invitee_member_id
SET mi.status = 'approved', mi.approved_at = NOW()
WHERE m.status = 'approved'
  AND mi.status IN ('sent', 'registered', 'payed')
  AND m.email_verified = 1;
