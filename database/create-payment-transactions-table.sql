-- Payment Transactions Table
-- Tracks all payment transactions from Stripe and other payment gateways

-- Create table without foreign key first
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

-- Add foreign key constraint if members table exists and constraint doesn't exist
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'payment_transactions' 
    AND CONSTRAINT_NAME = 'payment_transactions_ibfk_member_id'
    AND REFERENCED_TABLE_NAME = 'members'
);

SET @members_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'members'
);

SET @sql = IF(@members_exists > 0 AND @fk_exists = 0,
    'ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_ibfk_member_id FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE',
    'SELECT "Foreign key constraint skipped (members table does not exist or constraint already exists)" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

