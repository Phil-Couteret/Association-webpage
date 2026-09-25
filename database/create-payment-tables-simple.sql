-- Payment Tables Setup (Simple Version - No Foreign Keys)
-- Use this if foreign key constraints fail
-- Run this in phpMyAdmin

-- 1. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    payment_intent_id VARCHAR(255) NULL,
    payment_gateway ENUM('stripe', 'paypal', 'redsys', 'bank_transfer') NOT NULL DEFAULT 'stripe',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    membership_type ENUM('free', 'basic', 'sponsor', 'lifetime') NOT NULL,
    membership_start_date DATE NULL,
    membership_end_date DATE NULL,
    payment_method VARCHAR(50) NULL,
    gateway_response TEXT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_member_id (member_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_payment_intent_id (payment_intent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Payment Webhooks Table
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gateway VARCHAR(50) NOT NULL DEFAULT 'stripe',
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    payload TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gateway (gateway),
    INDEX idx_event_id (event_id),
    INDEX idx_processed (processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Payment Configuration Table
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

