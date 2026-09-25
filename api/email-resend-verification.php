<?php
/**
 * Resend Email Verification API
 * Sends a new verification email to unverified members
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
    
    // Find member
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            email, 
            first_name,
            email_verified,
            email_verification_token,
            status
        FROM members 
        WHERE email = :email
    ");
    $stmt->execute([':email' => $email]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Always return success to prevent email enumeration
    if (!$member) {
        echo json_encode([
            'success' => true,
            'message' => 'If your email is registered, you will receive a verification link shortly.'
        ]);
        exit();
    }
    
    // Check if already verified
    if ($member['email_verified'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => 'Your email is already verified. You can log in now.'
        ]);
        exit();
    }
    
    // Generate new token if doesn't exist
    $token = $member['email_verification_token'];
    if (!$token) {
        $token = bin2hex(random_bytes(32));
        
        $updateStmt = $pdo->prepare("
            UPDATE members 
            SET email_verification_token = :token
            WHERE id = :member_id
        ");
        $updateStmt->execute([
            ':token' => $token,
            ':member_id' => $member['id']
        ]);
    }
    
    // Send verification email
    $verificationLink = "https://www.elektr-ame.com/verify-email?token=" . $token;
    
    $subject = "Verify Your Email - Elektr-Âme";
    $message = "Hello {$member['first_name']},\n\n";
    $message .= "Thank you for registering with Elektr-Âme!\n\n";
    $message .= "Please click the link below to verify your email address:\n";
    $message .= $verificationLink . "\n\n";
    $message .= "Once verified, you'll be able to access your member portal.\n\n";
    $message .= "If you didn't create an account with us, please ignore this email.\n\n";
    $message .= "Best regards,\n";
    $message .= "The Elektr-Âme Team";
    
    require_once __DIR__ . '/classes/Mailer.php';
    $emailSent = Mailer::send($member['email'], $subject, $message, ['toName' => $member['first_name'] ?? '']);
    
    if (!$emailSent) {
        error_log("Failed to resend verification email to: " . $email);
    }
    
    // Log the action
    error_log("Verification email resent for member ID: {$member['id']} ({$email})");
    
    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Verification email sent! Please check your inbox.'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in email-resend-verification: " . $e->getMessage());
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

