<?php
/**
 * Password Reset Confirm API
 * Validates token and sets new password
 */

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
    
    if (!$input || !isset($input['token']) || !isset($input['new_password'])) {
        throw new Exception('Token and new password are required');
    }
    
    $token = trim($input['token']);
    $newPassword = $input['new_password'];
    
    // Validate password length
    if (strlen($newPassword) < 8) {
        throw new Exception('Password must be at least 8 characters long');
    }
    
    // Find valid token
    $stmt = $pdo->prepare("
        SELECT 
            prt.id as token_id,
            prt.member_id,
            prt.expires_at,
            prt.used,
            m.email,
            m.first_name,
            m.status
        FROM password_reset_tokens prt
        INNER JOIN members m ON prt.member_id = m.id
        WHERE prt.token = :token
    ");
    $stmt->execute([':token' => $token]);
    $resetRequest = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Validate token
    if (!$resetRequest) {
        throw new Exception('Invalid or expired reset link');
    }
    
    if ($resetRequest['used'] == 1) {
        throw new Exception('This reset link has already been used');
    }
    
    if (strtotime($resetRequest['expires_at']) < time()) {
        throw new Exception('This reset link has expired. Please request a new one.');
    }
    
    if ($resetRequest['status'] === 'rejected') {
        throw new Exception('Unable to reset password for this account');
    }
    
    // Hash new password
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Update member's password
        $updateStmt = $pdo->prepare("
            UPDATE members 
            SET password_hash = :password_hash
            WHERE id = :member_id
        ");
        $updateStmt->execute([
            ':password_hash' => $passwordHash,
            ':member_id' => $resetRequest['member_id']
        ]);
        
        // Mark token as used
        $markUsedStmt = $pdo->prepare("
            UPDATE password_reset_tokens 
            SET used = 1, used_at = NOW() 
            WHERE id = :token_id
        ");
        $markUsedStmt->execute([':token_id' => $resetRequest['token_id']]);
        
        // Commit transaction
        $pdo->commit();
        
        // Log the action
        error_log("Password successfully reset for member ID: {$resetRequest['member_id']} ({$resetRequest['email']})");
        
        // Send confirmation email
        $subject = "Password Successfully Reset - Elektr-Âme";
        $message = "Hello {$resetRequest['first_name']},\n\n";
        $message .= "Your password has been successfully reset.\n\n";
        $message .= "If you did not make this change, please contact us immediately at info@elektr-ame.com\n\n";
        $message .= "Best regards,\n";
        $message .= "The Elektr-Âme Team";
        
        require_once __DIR__ . '/classes/Mailer.php';
        Mailer::send($resetRequest['email'], $subject, $message, ['toName' => $resetRequest['first_name'] ?? '']);
        
        // Return success
        echo json_encode([
            'success' => true,
            'message' => 'Password reset successfully. You can now log in with your new password.'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Database error in password-reset-confirm: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'A server error occurred. Please try again later.'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

