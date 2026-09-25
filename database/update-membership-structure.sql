-- Update membership structure to yearly-based system
-- 4 tiers: free, basic (€40/year), sponsor (>€40/year), lifetime

-- First, update the enum to match new structure
ALTER TABLE members 
MODIFY COLUMN membership_type ENUM('free', 'basic', 'sponsor', 'lifetime') DEFAULT 'free';

-- Add tax deduction eligibility flag for sponsors
ALTER TABLE members
ADD COLUMN tax_deductible BOOLEAN DEFAULT FALSE AFTER payment_amount,
ADD COLUMN tax_receipt_sent BOOLEAN DEFAULT FALSE AFTER tax_deductible,
ADD COLUMN tax_receipt_date DATE NULL AFTER tax_receipt_sent;

-- Add membership pricing reference
-- Basic: €40/year
-- Sponsor: >€40/year (any amount) with tax benefits
-- Lifetime: One-time payment (price TBD)

-- Update existing free_trial members to 'free'
UPDATE members SET membership_type = 'free' WHERE membership_type = 'free_trial';

-- Update existing monthly members to 'basic' (if they paid €40)
UPDATE members 
SET membership_type = 'basic' 
WHERE membership_type = 'monthly' 
AND (payment_amount IS NULL OR payment_amount <= 40);

-- Update existing yearly members to 'sponsor' (if they paid >€40)
UPDATE members 
SET membership_type = 'sponsor',
    tax_deductible = TRUE
WHERE membership_type = 'yearly' 
AND payment_amount > 40;

-- Update existing yearly members to 'basic' (if they paid exactly €40)
UPDATE members 
SET membership_type = 'basic'
WHERE membership_type = 'yearly' 
AND payment_amount = 40;

-- Comments for future reference
-- FREE: Newsletter + renewal option only
-- BASIC: €40/year - Full membership
-- SPONSOR: >€40/year - Full membership + tax deduction
-- LIFETIME: One-time payment - Permanent membership

-- Tax deduction calculation (Spain RDL 6/2023):
-- First €250: 80% deduction
-- Above €250: 40% deduction (45% if recurring 3+ years)
-- Example: €100 donation = €80 tax back (only costs €20)
-- Example: €300 donation = €200 (first €250) + €20 (remaining €50) = €220 tax back (only costs €80)

-- Create index for membership type queries
CREATE INDEX IF NOT EXISTS idx_membership_type ON members (membership_type);
CREATE INDEX IF NOT EXISTS idx_tax_deductible ON members (tax_deductible);

