-- Add payment_intent_id column for charge.refunded webhook lookup
-- Checkout Sessions store session_id (cs_xxx); charge.refunded provides payment_intent (pi_xxx)
-- Run this migration to enable refund status updates
--
-- Note: If you get "Duplicate column" error, the migration was already applied.
-- New installs: create-payment-tables-simple.sql already includes this column.

ALTER TABLE payment_transactions 
ADD COLUMN payment_intent_id VARCHAR(255) NULL AFTER transaction_id,
ADD INDEX idx_payment_intent_id (payment_intent_id);
