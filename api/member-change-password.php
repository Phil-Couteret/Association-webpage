<?php
/**
 * Member Change Password API
 * Allows members to change their own password
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

// Check if member is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['current_password']) || !isset($input['new_password'])) {
        throw new Exception('Current password and new password are required');
    }
    
    $memberId = $_SESSION['member_id'];
    $currentPassword = $input['current_password'];
    $newPassword = $input['new_password'];
    
    // Validate new password length
    if (strlen($newPassword) < 8) {
        throw new Exception('New password must be at least 8 characters long');
    }
    
    // Get current password hash from database
    $stmt = $pdo->prepare("
        SELECT password_hash 
        FROM members 
        WHERE id = :member_id
    ");
    $stmt->execute([':member_id' => $memberId]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$member) {
        throw new Exception('Member not found');
    }
    
    // Verify current password
    if (!password_verify($currentPassword, $member['password_hash'])) {
        throw new Exception('Current password is incorrect');
    }
    
    // Hash new password
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update password in database
    $updateStmt = $pdo->prepare("
        UPDATE members 
        SET password_hash = :password_hash
        WHERE id = :member_id
    ");
    
    $updateStmt->execute([
        ':password_hash' => $newPasswordHash,
        ':member_id' => $memberId
    ]);
    
    // Log the action
    error_log("Member ID $memberId changed their password");
    
    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in member-change-password: " . $e->getMessage());
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

