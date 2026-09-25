-- Add company fields for "pay on behalf of company" (tax receipt to company)
-- Members can optionally add company details; when paying, they can choose to issue tax receipt to company

ALTER TABLE members
ADD COLUMN company_name VARCHAR(255) NULL AFTER country,
ADD COLUMN company_cif VARCHAR(50) NULL AFTER company_name,
ADD COLUMN company_address TEXT NULL AFTER company_cif;
