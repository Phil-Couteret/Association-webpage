<?php
/**
 * Admin API - Set/Reset Member Password
 * Allows admins to set or reset passwords for members
 */

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

// Check if admin is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output, log them instead

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['member_id'])) {
        throw new Exception('Member ID is required');
    }
    
    $memberId = intval($input['member_id']);
    
    // Check if we should generate a random password or use provided one
    if (isset($input['password']) && !empty($input['password'])) {
        // Admin provided a specific password
        $password = $input['password'];
    } else {
        // Generate a random 8-character password
        $password = bin2hex(random_bytes(4));
    }
    
    // Hash the password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Update member's password
    $stmt = $pdo->prepare("
        UPDATE members 
        SET password_hash = :password_hash
        WHERE id = :member_id
    ");
    
    $stmt->execute([
        ':password_hash' => $passwordHash,
        ':member_id' => $memberId
    ]);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Member not found or password unchanged');
    }
    
    // Get member info for response
    $memberStmt = $pdo->prepare("
        SELECT id, email, first_name, second_name 
        FROM members 
        WHERE id = :member_id
    ");
    $memberStmt->execute([':member_id' => $memberId]);
    $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
    
    // Log the action
    error_log("Admin " . $_SESSION['admin_email'] . " set password for member ID: " . $memberId);
    
    // Return success with the new password (so admin can share it)
    echo json_encode([
        'success' => true,
        'message' => 'Password set successfully',
        'new_password' => $password,
        'member' => [
            'id' => $member['id'],
            'email' => $member['email'],
            'name' => $member['first_name'] . ' ' . $member['second_name']
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-set-member-password: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

