-- Enhanced members table with membership management
-- This adds new columns to the existing members table

-- Add new columns for membership management
ALTER TABLE members
ADD COLUMN membership_type ENUM('free_trial', 'monthly', 'yearly', 'lifetime') DEFAULT 'free_trial' AFTER status,
ADD COLUMN membership_start_date DATE NULL AFTER membership_type,
ADD COLUMN membership_end_date DATE NULL AFTER membership_start_date,
ADD COLUMN payment_status ENUM('unpaid', 'paid', 'overdue') DEFAULT 'unpaid' AFTER membership_end_date,
ADD COLUMN last_payment_date DATE NULL AFTER payment_status,
ADD COLUMN payment_amount DECIMAL(10, 2) NULL AFTER last_payment_date,
ADD COLUMN notes TEXT NULL AFTER payment_amount,
ADD INDEX idx_membership_type (membership_type),
ADD INDEX idx_membership_end_date (membership_end_date),
ADD INDEX idx_payment_status (payment_status);

-- Update existing members to have a default membership (optional)
-- Uncomment the line below if you want to set all existing pending members to free trial
-- UPDATE members SET membership_type = 'free_trial', membership_start_date = created_at WHERE status = 'pending';






