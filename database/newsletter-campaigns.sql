-- Create newsletter campaigns table to track sent newsletters
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by INT NOT NULL,
    recipients_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add unsubscribe token to subscribers table
ALTER TABLE newsletter_subscribers 
ADD COLUMN unsubscribe_token VARCHAR(64) NULL AFTER user_agent;

-- Create index on unsubscribe token for fast lookups
CREATE INDEX idx_unsubscribe_token ON newsletter_subscribers (unsubscribe_token);

