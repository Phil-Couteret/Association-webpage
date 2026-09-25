-- Elektr-Âme Database Schema
-- PHP 8.4 Compatible

-- Create database
CREATE DATABASE IF NOT EXISTS elektr_ame CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE elektr_ame;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    street VARCHAR(255) NULL,
    zip_code VARCHAR(20) NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create events table (for future use)
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(255),
    capacity INT,
    price DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('draft', 'published', 'cancelled') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create artists table (for future use)
CREATE TABLE IF NOT EXISTS artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    genre VARCHAR(100),
    website VARCHAR(255),
    social_media JSON,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create member_events table (for event registrations)
CREATE TABLE IF NOT EXISTS member_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member_event (member_id, event_id),
    INDEX idx_member_id (member_id),
    INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional - will skip if already exists)
INSERT IGNORE INTO members (first_name, last_name, email, phone, city, country, status) VALUES
('John', 'Doe', 'john.doe@example.com', '+1234567890', 'Barcelona', 'Spain', 'approved'),
('Jane', 'Smith', 'jane.smith@example.com', '+34123456789', 'Barcelona', 'Spain', 'pending');

-- Create a view for member statistics
CREATE VIEW member_stats AS
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_members,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_members,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_members,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_members_last_30_days
FROM members;










