-- Create table for tracking member email change requests
CREATE TABLE IF NOT EXISTS member_email_change_requests (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    current_email VARCHAR(255) NOT NULL,
    new_email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL,
    status ENUM('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME NULL,
    expires_at DATETIME NULL,
    INDEX idx_member_status (member_id, status),
    UNIQUE KEY uniq_token (token),
    CONSTRAINT fk_member_email_change_member
        FOREIGN KEY (member_id) REFERENCES members(id)
        ON DELETE CASCADE
);


