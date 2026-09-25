-- Update membership flow: in_progress, yearly, lifetime
-- - in_progress: replaces free_trial/free (new user, awaiting approval/payment)
-- - yearly: paid and validated (replaces basic, sponsor, monthly)
-- - lifetime: applied by admins only

-- Step 1: Expand enum to include all old + new values
ALTER TABLE members 
MODIFY COLUMN membership_type ENUM(
  'free_trial', 'monthly', 'yearly', 'lifetime',
  'free', 'basic', 'sponsor',
  'in_progress'
) DEFAULT 'in_progress';

-- Step 2: Migrate to new values
UPDATE members SET membership_type = 'in_progress' 
WHERE membership_type IN ('free_trial', 'free');

UPDATE members SET membership_type = 'yearly' 
WHERE membership_type IN ('monthly', 'basic', 'sponsor', 'yearly');

-- Step 3: Shrink to final enum
ALTER TABLE members 
MODIFY COLUMN membership_type ENUM('in_progress', 'yearly', 'lifetime') DEFAULT 'in_progress';
