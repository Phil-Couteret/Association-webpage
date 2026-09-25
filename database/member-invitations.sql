-- Member Invitations Table
-- Tracks invitations sent by members to their contacts

CREATE TABLE IF NOT EXISTS member_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inviter_id INT NOT NULL COMMENT 'Member who sent the invitation',
    invitee_first_name VARCHAR(100) NOT NULL COMMENT 'First name of the person being invited',
    invitee_email VARCHAR(255) NOT NULL COMMENT 'Email address of the person being invited',
    status ENUM('sent', 'registered', 'payed', 'approved') DEFAULT 'sent' COMMENT 'Current status of the invitation',
    invitation_token VARCHAR(64) UNIQUE NULL COMMENT 'Unique token for invitation link (optional, for future email invitations)',
    invitee_member_id INT NULL COMMENT 'Member ID of the invitee once they register',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the invitation was sent',
    registered_at TIMESTAMP NULL COMMENT 'When the invitee registered',
    payed_at TIMESTAMP NULL COMMENT 'When the invitee paid their membership',
    approved_at TIMESTAMP NULL COMMENT 'When the invitee was approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (inviter_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (invitee_member_id) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_inviter_id (inviter_id),
    INDEX idx_invitee_email (invitee_email),
    INDEX idx_status (status),
    INDEX idx_invitation_token (invitation_token),
    UNIQUE KEY unique_invitation (inviter_id, invitee_email) COMMENT 'Prevent duplicate invitations from same member to same email'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

