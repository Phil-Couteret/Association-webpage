-- Admin Users Table for Elektr-Âme
-- This table stores admin user credentials securely with role-based access

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert superadmin user (tech@elektr-ame.com)
-- To generate a new hash, use: password_hash('your_password', PASSWORD_DEFAULT);
INSERT INTO admin_users (email, password_hash, name, role) VALUES 
('tech@elektr-ame.com', '$2y$10$YourHashWillGoHere', 'Super Admin', 'superadmin');

-- You can also create regular admins:
-- INSERT INTO admin_users (email, password_hash, name, role) VALUES 
-- ('admin@elektr-ame.com', '$2y$10$AnotherHashHere', 'Regular Admin', 'admin');

-- Note: You need to generate the actual password hash using PHP
-- Run this PHP script to generate the hash:

