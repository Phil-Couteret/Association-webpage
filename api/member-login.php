<?php
/**
 * Member Login API
 * Handles member authentication with email and password
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

// Include database configuration
require_once __DIR__ . '/config.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['email']) || empty($input['password'])) {
        throw new Exception('Email and password are required');
    }
    
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    $inputPassword = $input['password'];
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Get member from database
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            email, 
            password_hash, 
            first_name, 
            second_name,
            status,
            membership_type,
            email_verified
        FROM members 
        WHERE email = :email
    ");
    $stmt->execute([':email' => $email]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if member exists
    if (!$member) {
        // Don't reveal if member exists or not
        throw new Exception('Invalid email or password');
    }
    
    // Check if password is set
    if (empty($member['password_hash'])) {
        throw new Exception('No password set. Please contact admin or use forgot password.');
    }
    
    // Verify password
    if (!password_verify($inputPassword, $member['password_hash'])) {
        // Log failed attempt
        error_log("Failed login attempt for member email: " . $email);
        throw new Exception('Invalid email or password');
    }
    
    // Check if email is verified
    if (!$member['email_verified'] || $member['email_verified'] == 0) {
        throw new Exception('Please verify your email address. Check your inbox for the verification link, or request a new one.');
    }
    
    // Check if member is approved
    if ($member['status'] === 'rejected') {
        throw new Exception('Your membership application was not approved. Please contact us.');
    }
    
    // Create session (skipping last_login update as column may not exist)
    $_SESSION['member_id'] = $member['id'];
    $_SESSION['member_email'] = $member['email'];
    $_SESSION['member_name'] = $member['first_name'] . ' ' . $member['second_name'];
    $_SESSION['member_status'] = $member['status'];
    $_SESSION['login_time'] = time();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'member' => [
            'email' => $member['email'],
            'name' => $member['first_name'] . ' ' . $member['second_name'],
            'status' => $member['status'],
            'membership_type' => $member['membership_type']
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in member-login: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

