<?php
/**
 * Email Verification API
 * Verifies email address using token from email link
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {
    // Get token from GET or POST
    $token = null;
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['token'])) {
        $token = trim($_GET['token']);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input && isset($input['token'])) {
            $token = trim($input['token']);
        }
    }
    
    if (!$token) {
        throw new Exception('Verification token is required');
    }
    
    // Normalize token
    $token = trim($token);
    
    // Check if token belongs to an email change request first
    $changeRequest = false;
    try {
        $changeStmt = $pdo->prepare("
            SELECT 
                r.id,
                r.member_id,
                r.new_email,
                r.status,
                r.expires_at,
                m.email,
                m.first_name,
                m.status as member_status
            FROM member_email_change_requests r
            JOIN members m ON m.id = r.member_id
            WHERE r.token = :token
            LIMIT 1
        ");
        $changeStmt->execute([':token' => $token]);
        $changeRequest = $changeStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($changeRequest) {
            error_log("Email change request found: id={$changeRequest['id']}, member_id={$changeRequest['member_id']}, status={$changeRequest['status']}");
        } else {
            error_log("No email change request found for token: " . substr($token, 0, 8) . "...");
        }
    } catch (PDOException $e) {
        // Table might not exist yet - log and fall through to regular verification
        error_log("Email change request table query failed (might not exist): " . $e->getMessage());
        $changeRequest = false;
    }

    if ($changeRequest) {
        if ($changeRequest['status'] !== 'pending') {
            throw new Exception('This email change link is no longer valid.');
        }

        if ($changeRequest['expires_at'] && strtotime($changeRequest['expires_at']) < time()) {
            $pdo->prepare("UPDATE member_email_change_requests SET status = 'expired' WHERE id = ?")
                ->execute([$changeRequest['id']]);
            throw new Exception('This email change link has expired. Please request a new change.');
        }

        // Ensure the new email isn't used by someone else
        $duplicateStmt = $pdo->prepare("SELECT id FROM members WHERE LOWER(email) = :email AND id != :member_id");
        $duplicateStmt->execute([
            ':email' => strtolower($changeRequest['new_email']),
            ':member_id' => $changeRequest['member_id']
        ]);

        if ($duplicateStmt->fetch()) {
            throw new Exception('This email is already associated with another member.');
        }

        $pdo->beginTransaction();

        $updateMember = $pdo->prepare("
            UPDATE members 
            SET email = :new_email,
                email_verified = 1,
                email_verified_at = NOW(),
                email_verification_token = NULL
            WHERE id = :member_id
        ");
        $updateMember->execute([
            ':new_email' => $changeRequest['new_email'],
            ':member_id' => $changeRequest['member_id']
        ]);

        $updateRequest = $pdo->prepare("
            UPDATE member_email_change_requests 
            SET status = 'confirmed',
                confirmed_at = NOW()
            WHERE id = :id
        ");
        $updateRequest->execute([':id' => $changeRequest['id']]);

        $pdo->commit();

        if (isset($_SESSION['member_id']) && $_SESSION['member_id'] == $changeRequest['member_id']) {
            $_SESSION['member_email'] = $changeRequest['new_email'];
        }

        echo json_encode([
            'success' => true,
            'already_verified' => false,
            'message' => 'Your email address has been updated successfully.',
            'verification_type' => 'email_change',
            'member_status' => $changeRequest['member_status']
        ]);
        exit();
    }

    // Find member with this verification token
    $stmt = $pdo->prepare("
        SELECT 
            id, 
            email, 
            first_name, 
            email_verified,
            status
        FROM members 
        WHERE email_verification_token = :token
    ");
    $stmt->execute([':token' => $token]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$member) {
        throw new Exception('Invalid verification link');
    }
    
    // Check if already verified
    if ($member['email_verified'] == 1) {
        echo json_encode([
            'success' => true,
            'already_verified' => true,
            'message' => 'Email address already verified. You can log in now.',
            'verification_type' => 'account',
            'member_status' => $member['status']
        ]);
        exit();
    }
    
    // Verify the email
    $updateStmt = $pdo->prepare("
        UPDATE members 
        SET 
            email_verified = 1,
            email_verified_at = NOW(),
            email_verification_token = NULL
        WHERE id = :member_id
    ");
    $updateStmt->execute([':member_id' => $member['id']]);
    
    // Log the action
    error_log("Email verified for member ID: {$member['id']} ({$member['email']})");
    
    // Send welcome email and membership confirmation
    $subject = "Welcome to Elektr-Âme!";
    $message = "Hello {$member['first_name']},\n\n";
    $message .= "Thank you for verifying your email address!\n\n";
    $message .= "Your email has been confirmed and your account is now active.\n\n";
    $message .= "You can now log in to your member portal and complete your membership payment at:\n";
    $message .= "https://www.elektr-ame.com/member-login\n\n";
    $message .= "Best regards,\n";
    $message .= "The Elektr-Âme Team";
    
    require_once __DIR__ . '/classes/Mailer.php';
    Mailer::send($member['email'], $subject, $message, ['toName' => $member['first_name'] ?? '']);

    if ($member['status'] === 'approved') {
        try {
            require_once __DIR__ . '/classes/EmailAutomation.php';
            $emailAutomation = new EmailAutomation($pdo);
            $emailAutomation->triggerAutomation('member_approved', $member['id']);
            $emailAutomation->processQueue(10);
        } catch (Exception $e) {
            error_log("Member approved email automation failed after verification: " . $e->getMessage());
        }
    } elseif ($member['status'] === 'pending') {
        // Legacy accounts still awaiting manual approval
        error_log("Email verified for pending member ID: {$member['id']} — awaiting admin approval");
    }
    
    // Return success
    echo json_encode([
        'success' => true,
        'already_verified' => false,
        'message' => 'Email verified successfully! You can now log in.',
        'member_status' => $member['status'],
        'verification_type' => 'account'
    ]);
    
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Database error in email-verify: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'A server error occurred. Please try again later.'
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

