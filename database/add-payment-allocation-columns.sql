-- Add allocation tracking to payment_transactions table
-- This allows members to choose how to allocate their payment balance

ALTER TABLE payment_transactions
ADD COLUMN allocated_amount DECIMAL(10, 2) DEFAULT 0.00 AFTER amount,
ADD COLUMN allocation_type ENUM('membership_years', 'sponsor_donation') NULL AFTER allocated_amount,
ADD COLUMN allocation_years INT NULL AFTER allocation_type,
ADD COLUMN allocation_date TIMESTAMP NULL AFTER allocation_years;

-- Add index for faster queries
ALTER TABLE payment_transactions
ADD INDEX idx_allocated_amount (allocated_amount),
ADD INDEX idx_allocation_type (allocation_type);

