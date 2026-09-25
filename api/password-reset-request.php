<?php
/**
 * Password Reset Request API
 * Generates a secure token and sends password reset email
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
    
    if (!$input || !isset($input['email'])) {
        throw new Exception('Email is required');
    }
    
    $email = trim($input['email']);
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Check if member exists (but don't reveal if they do or don't for security)
    $stmt = $pdo->prepare("
        SELECT id, first_name, email, status 
        FROM members 
        WHERE email = :email
    ");
    $stmt->execute([':email' => $email]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Always return success to prevent email enumeration attacks
    // But only send email if member exists
    if ($member) {
        // Don't send reset email to rejected members
        if ($member['status'] === 'rejected') {
            // Still return success message for security
            echo json_encode([
                'success' => true,
                'message' => 'If this email is registered, you will receive a password reset link shortly.'
            ]);
            exit();
        }
        
        // Generate secure token
        $token = bin2hex(random_bytes(32)); // 64 character token
        
        // Set expiration (1 hour from now)
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
        
        // Get client IP
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        
        // Invalidate any existing unused tokens for this member
        $invalidateStmt = $pdo->prepare("
            UPDATE password_reset_tokens 
            SET used = 1, used_at = NOW() 
            WHERE member_id = :member_id AND used = 0
        ");
        $invalidateStmt->execute([':member_id' => $member['id']]);
        
        // Insert new token
        $insertStmt = $pdo->prepare("
            INSERT INTO password_reset_tokens 
            (member_id, token, expires_at, ip_address) 
            VALUES (:member_id, :token, :expires_at, :ip_address)
        ");
        $insertStmt->execute([
            ':member_id' => $member['id'],
            ':token' => $token,
            ':expires_at' => $expiresAt,
            ':ip_address' => $ipAddress
        ]);
        
        // Send password reset email
        $resetLink = "https://www.elektr-ame.com/reset-password?token=" . $token;
        
        $subject = "Password Reset Request - Elektr-Âme";
        $message = "Hello {$member['first_name']},\n\n";
        $message .= "We received a request to reset your password for your Elektr-Âme member account.\n\n";
        $message .= "Click the link below to reset your password:\n";
        $message .= $resetLink . "\n\n";
        $message .= "This link will expire in 1 hour.\n\n";
        $message .= "If you didn't request this password reset, please ignore this email. Your password will remain unchanged.\n\n";
        $message .= "Best regards,\n";
        $message .= "The Elektr-Âme Team";
        
        require_once __DIR__ . '/classes/Mailer.php';
        $emailSent = Mailer::send($email, $subject, $message, ['toName' => $member['first_name'] ?? '']);
        
        if (!$emailSent) {
            error_log("Failed to send password reset email to: " . $email);
        }
        
        // Log the action
        error_log("Password reset requested for member ID: {$member['id']} ({$email})");
    }
    
    // Always return success message (security best practice)
    echo json_encode([
        'success' => true,
        'message' => 'If this email is registered, you will receive a password reset link shortly.'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in password-reset-request: " . $e->getMessage());
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

