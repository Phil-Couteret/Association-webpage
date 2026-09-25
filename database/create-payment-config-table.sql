-- Payment Configuration Table
-- Stores payment gateway API keys and configuration securely

CREATE TABLE IF NOT EXISTS payment_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway VARCHAR(50) NOT NULL UNIQUE DEFAULT 'stripe',
    is_active BOOLEAN DEFAULT FALSE,
    api_key_public VARCHAR(255) NULL,
    api_key_secret VARCHAR(255) NULL,
    webhook_secret VARCHAR(255) NULL,
    config_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default Stripe config (inactive)
INSERT INTO payment_config (gateway, is_active) 
VALUES ('stripe', FALSE)
ON DUPLICATE KEY UPDATE gateway = gateway;

