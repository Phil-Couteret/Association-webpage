-- Links an Open Call submission to the artist row created from it (one-way).
-- Run once on existing databases.
-- No AFTER clause: works whether or not you have run alter-open-call-archive-future-session.sql yet.

ALTER TABLE open_call_submissions
  ADD COLUMN promoted_artist_id INT NULL DEFAULT NULL,
  ADD INDEX idx_promoted_artist (promoted_artist_id),
  ADD CONSTRAINT fk_oc_promoted_artist
    FOREIGN KEY (promoted_artist_id) REFERENCES artists(id) ON DELETE SET NULL;
