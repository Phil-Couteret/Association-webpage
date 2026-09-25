-- Add payment_method to members table for manual payment recording (cash, wire, etc.)
-- Run: Execute in phpMyAdmin or mysql CLI
--
-- Required for: Admin membership dialog to record how pre-Stripe members paid
-- If you get "Duplicate column" error, the migration was already applied.

ALTER TABLE members
ADD COLUMN payment_method VARCHAR(50) NULL AFTER payment_amount;
