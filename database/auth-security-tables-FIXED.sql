-- Phase 1: Essential Security - Database Schema (MySQL Compatible)
-- Password Reset Tokens & Email Verification

-- 1. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_member_id (member_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add Email Verification Fields to Members Table
-- Note: Run these one at a time if you get "duplicate column" errors

ALTER TABLE members
ADD COLUMN email_verified TINYINT(1) DEFAULT 0 AFTER email;

ALTER TABLE members
ADD COLUMN email_verification_token VARCHAR(64) NULL AFTER email_verified;

ALTER TABLE members
ADD COLUMN email_verified_at DATETIME NULL AFTER email_verification_token;

-- 3. Add index for email verification token
ALTER TABLE members
ADD INDEX idx_email_verification_token (email_verification_token);

-- 4. Optional: Set existing members as verified (if you want them to login without verification)
-- Uncomment the line below if you want existing members to bypass email verification:
-- UPDATE members SET email_verified = 1 WHERE email_verified = 0;

-- 5. Clean up expired password reset tokens (optional - run periodically)
-- DELETE FROM password_reset_tokens WHERE expires_at < NOW() AND used = 0;

