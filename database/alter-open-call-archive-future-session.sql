-- Add archive + future session flags (run on existing DB).
-- Use TINYINT without display width (MySQL 8.0.17+ deprecates TINYINT(1) — warning #1681).

ALTER TABLE open_call_submissions
  ADD COLUMN future_session TINYINT NOT NULL DEFAULT 0 AFTER rebooking_possible,
  ADD COLUMN archived TINYINT NOT NULL DEFAULT 0 AFTER future_session,
  ADD INDEX idx_archived (archived);