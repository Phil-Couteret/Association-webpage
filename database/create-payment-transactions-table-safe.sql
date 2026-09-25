-- Payment Transactions Table (Safe Version - No Foreign Key)
-- Use this if the foreign key constraint fails
-- Tracks all payment transactions from Stripe and other payment gateways

CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
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
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Foreign key constraint removed to avoid errors
-- The application will handle referential integrity

