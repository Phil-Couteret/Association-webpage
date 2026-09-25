-- Add Paycomet support for payment processing
-- Run this migration before configuring Paycomet

-- 1. Add Paycomet row to payment_config
INSERT INTO payment_config (gateway, is_active) 
VALUES ('paycomet', FALSE)
ON DUPLICATE KEY UPDATE gateway = gateway;

-- 2. Add 'paycomet' to payment_transactions.payment_gateway ENUM
ALTER TABLE payment_transactions 
MODIFY COLUMN payment_gateway ENUM('stripe', 'paypal', 'redsys', 'bank_transfer', 'paycomet') NOT NULL DEFAULT 'stripe';
