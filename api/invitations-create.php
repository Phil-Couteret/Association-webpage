<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/EmailAutomation.php';

try {
    // Check if member is logged in
    if (!isset($_SESSION['member_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Not authenticated. Please log in.'
        ]);
        exit;
    }

    $inviterId = $_SESSION['member_id'];

    // Verify member is approved and has paid
    $stmt = $pdo->prepare("SELECT status, payment_status FROM members WHERE id = ?");
    $stmt->execute([$inviterId]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$member) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Member not found'
        ]);
        exit;
    }

    if ($member['status'] !== 'approved' || $member['payment_status'] !== 'paid') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'You must be an approved member with paid membership to send invitations'
        ]);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (empty($input['first_name']) || empty($input['email'])) {
        throw new Exception('First name and email are required');
    }

    // Validate email format
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    $inviteeFirstName = trim($input['first_name']);
    $inviteeEmail = strtolower(trim($input['email']));

    // Check if invitation already exists
    $stmt = $pdo->prepare("SELECT id FROM member_invitations WHERE inviter_id = ? AND invitee_email = ?");
    $stmt->execute([$inviterId, $inviteeEmail]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'You have already sent an invitation to this email address'
        ]);
        exit;
    }

    // Check if email is already a member
    $stmt = $pdo->prepare("SELECT id FROM members WHERE email = ?");
    $stmt->execute([$inviteeEmail]);
    $existingMember = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingMember) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'This email address is already registered as a member'
        ]);
        exit;
    }

    // Generate invitation token for tracking
    $invitationToken = bin2hex(random_bytes(32)); // 64 character token

    // Create invitation
    $stmt = $pdo->prepare("
        INSERT INTO member_invitations (
            inviter_id,
            invitee_first_name,
            invitee_email,
            status,
            invitation_token,
            sent_at
        ) VALUES (?, ?, ?, 'sent', ?, NOW())
    ");

    $stmt->execute([$inviterId, $inviteeFirstName, $inviteeEmail, $invitationToken]);
    $invitationId = $pdo->lastInsertId();

    // Fetch the created invitation
    $stmt = $pdo->prepare("
        SELECT 
            id,
            inviter_id,
            invitee_first_name,
            invitee_email,
            status,
            sent_at,
            registered_at,
            payed_at,
            approved_at,
            created_at
        FROM member_invitations
        WHERE id = ?
    ");
    $stmt->execute([$invitationId]);
    $invitation = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get inviter information for the email
    $stmt = $pdo->prepare("SELECT first_name, second_name FROM members WHERE id = ?");
    $stmt->execute([$inviterId]);
    $inviter = $stmt->fetch(PDO::FETCH_ASSOC);
    $inviterName = $inviter ? ($inviter['first_name'] . ' ' . $inviter['second_name']) : 'A friend';

    // Send invitation email using template system
    try {
        $joinLink = "https://www.elektr-ame.com/join-us?invite=" . $invitationToken;
        
        // Get the invitation template
        $stmt = $pdo->prepare("SELECT * FROM email_templates WHERE template_key = 'member_invitation' AND active = 1");
        $stmt->execute();
        $template = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$template) {
            // Fallback to hardcoded email if template doesn't exist
            $subject = "You've been invited to join Elektr-Âme! 🎵";
            $message = "Hello {$inviteeFirstName},\n\n";
            $message .= "{$inviterName} has invited you to join Elektr-Âme, an electronic music community and association based in Barcelona.\n\n";
            $message .= "**About Elektr-Âme:**\n";
            $message .= "We're a community focused on developing electronic music projects, hosting events, and building a network of artists and enthusiasts.\n\n";
            $message .= "**What you'll get:**\n";
            $message .= "- Access to exclusive events and workshops\n";
            $message .= "- Networking opportunities with artists and producers\n";
            $message .= "- Digital membership card\n";
            $message .= "- Support for the electronic music community\n\n";
            $message .= "**Join us now:**\n";
            $message .= "Click here to register: {$joinLink}\n\n";
            $message .= "This link includes a special invitation code from {$inviterName}.\n\n";
            $message .= "If you have any questions, feel free to reach out to us at contact@elektr-ame.com.\n\n";
            $message .= "We hope to see you soon!\n\n";
            $message .= "Best regards,\n";
            $message .= "The Elektr-Âme Team\n\n";
            $message .= "---\n";
            $message .= "This invitation was sent by {$inviterName}.\n";
            $message .= "If you didn't expect this invitation, you can safely ignore this email.\n";
        } else {
            // Use template - default to English for invitations (invitee language not known yet)
            $lang = 'en';
            
            // Replace variables in subject and body
            $subject = str_replace(
                ['{{invitee_first_name}}', '{{inviter_name}}', '{{invitation_link}}'],
                [$inviteeFirstName, $inviterName, $joinLink],
                $template["subject_$lang"]
            );
            
            $message = str_replace(
                ['{{invitee_first_name}}', '{{inviter_name}}', '{{invitation_link}}'],
                [$inviteeFirstName, $inviterName, $joinLink],
                $template["body_$lang"]
            );
        }
        
        require_once __DIR__ . '/classes/Mailer.php';
        $mailResult = Mailer::send($inviteeEmail, $subject, $message, ['toName' => $inviteeFirstName]);
        
        // Update invitation with email sending status
        if ($mailResult) {
            error_log("Invitation email sent successfully to: {$inviteeEmail} from member ID: {$inviterId}");
            $updateStmt = $pdo->prepare("
                UPDATE member_invitations 
                SET email_sent = 1, email_sent_at = NOW(), email_error = NULL
                WHERE id = ?
            ");
            $updateStmt->execute([$invitationId]);
        } else {
            $errorMsg = "Failed to send invitation email";
            error_log("Failed to send invitation email to: {$inviteeEmail}");
            $updateStmt = $pdo->prepare("
                UPDATE member_invitations 
                SET email_sent = 0, email_error = ?
                WHERE id = ?
            ");
            $updateStmt->execute([$errorMsg, $invitationId]);
            // Don't fail the invitation creation if email fails
        }
    } catch (Exception $e) {
        error_log("Error sending invitation email: " . $e->getMessage());
        // Don't fail the invitation creation if email fails
    }

    echo json_encode([
        'success' => true,
        'message' => 'Invitation sent successfully',
        'invitation' => $invitation
    ]);

} catch (PDOException $e) {
    error_log("Database error in invitations-create.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

