-- Run after initial open_call_submissions exists.
-- Adds promo consent, photo, admin selection fields, and rebooking dates.

ALTER TABLE open_call_submissions
  ADD COLUMN photo_path VARCHAR(512) NULL AFTER mix_file_original_name,
  ADD COLUMN promo_consent TINYINT(1) NOT NULL DEFAULT 0 AFTER photo_path,
  ADD COLUMN selected TINYINT(1) NOT NULL DEFAULT 0 AFTER promo_consent,
  ADD COLUMN selection_date DATE NULL AFTER selected,
  ADD COLUMN rebooking_possible TINYINT(1) NOT NULL DEFAULT 0 AFTER selection_date,
  ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE TABLE IF NOT EXISTS open_call_rebooking_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  booking_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_submission (submission_id),
  CONSTRAINT fk_oc_rebooking_submission
    FOREIGN KEY (submission_id) REFERENCES open_call_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
