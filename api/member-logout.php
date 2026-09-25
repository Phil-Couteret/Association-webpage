<?php
/**
 * Member Logout API
 * Handles member session termination
 */

// Start session
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Check if member is logged in
    if (!isset($_SESSION['member_id'])) {
        throw new Exception('Not logged in');
    }
    
    // Destroy member session
    unset($_SESSION['member_id']);
    unset($_SESSION['member_email']);
    unset($_SESSION['member_name']);
    unset($_SESSION['member_status']);
    unset($_SESSION['login_time']);
    
    // If there are no other session variables (like admin), destroy the entire session
    if (empty($_SESSION)) {
        session_destroy();
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

