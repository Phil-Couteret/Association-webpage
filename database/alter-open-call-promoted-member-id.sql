-- Links an Open Call submission to the member row created or linked (complimentary membership).
-- Run once on existing databases.

ALTER TABLE open_call_submissions
  ADD COLUMN promoted_member_id INT NULL DEFAULT NULL,
  ADD INDEX idx_promoted_member (promoted_member_id);
