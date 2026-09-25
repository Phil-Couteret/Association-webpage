-- Open Call (for DJ): full schema for new installs.

CREATE TABLE IF NOT EXISTS open_call_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(64) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dj_name VARCHAR(255) NOT NULL,
    musical_style TEXT NOT NULL,
    mix_link VARCHAR(2048) NULL,
    mix_file_path VARCHAR(512) NULL,
    mix_file_original_name VARCHAR(255) NULL,
    photo_path VARCHAR(512) NULL,
    promo_consent TINYINT NOT NULL DEFAULT 0,
    selected TINYINT NOT NULL DEFAULT 0,
    selection_date DATE NULL,
    rebooking_possible TINYINT NOT NULL DEFAULT 0,
    future_session TINYINT NOT NULL DEFAULT 0,
    archived TINYINT NOT NULL DEFAULT 0,
    promoted_artist_id INT NULL DEFAULT NULL,
    promoted_member_id INT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_email (email),
    INDEX idx_archived (archived),
    INDEX idx_promoted_artist (promoted_artist_id),
    INDEX idx_promoted_member (promoted_member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS open_call_rebooking_dates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  booking_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_submission (submission_id),
  CONSTRAINT fk_oc_rebooking_submission
    FOREIGN KEY (submission_id) REFERENCES open_call_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
