-- Tax receipt downloads: store PDF temporarily for secure link download
-- Avoids attachment delivery issues on shared hosting (OVH)
-- Run this on OVH: mysql -u elektry2025 -p elektry2025 < database/tax-receipt-downloads-table.sql
CREATE TABLE IF NOT EXISTS tax_receipt_downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    member_id INT NOT NULL,
    pdf_content LONGBLOB NOT NULL,
    receipt_id VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
);
