-- Portal Module Database Schema
-- Consultancy Inquiries and Company Creation Requests

-- Consultancy Inquiries Table
CREATE TABLE IF NOT EXISTS consultancy_inquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NULL,
    inquiry_type ENUM('general', 'strategy', 'legal', 'financial', 'other') NOT NULL,
    message TEXT NOT NULL,
    preferred_contact_method ENUM('email', 'phone', 'both') NOT NULL DEFAULT 'email',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company Creation Requests Table
CREATE TABLE IF NOT EXISTS company_creation_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_type ENUM('LLC', 'Corporation', 'Partnership', 'Sole Proprietorship', 'Other') NOT NULL,
    business_activity TEXT NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL,
    share_capital VARCHAR(50) NULL,
    additional_notes TEXT NULL,
    urgency ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    consultancy_inquiry_id INT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_urgency (urgency),
    INDEX idx_consultancy_inquiry_id (consultancy_inquiry_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (consultancy_inquiry_id) REFERENCES consultancy_inquiries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

