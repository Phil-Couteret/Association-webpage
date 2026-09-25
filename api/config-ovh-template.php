<?php
// OVH Database Configuration for Elektr-Âme
// 
// INSTRUCTIONS:
// 1. Copy this file to config.php: cp config-ovh-template.php config.php
// 2. Update the credentials below with your OVH database credentials
// 3. NEVER commit config.php to git! (it's in .gitignore)
//
// OVH Database Credentials (from previous deployments):
// - Host: elektry2025.mysql.db
// - Database: elektry2025
// - Username: elektry
// - Password: (set in OVH control panel)

// Database configuration
$host = 'elektry2025.mysql.db';        // OVH MySQL host
$dbname = 'elektry2025';                // OVH database name
$username = 'elektry';                  // OVH database username (NOT elektry2025)
$password = 'YOUR_OVH_PASSWORD';        // ⚠️ UPDATE THIS with your OVH database password

try {
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}
?>









