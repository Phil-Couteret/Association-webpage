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

try {
    // Check if user is admin
    if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? null;
    $memberId = isset($input['member_id']) ? (int)$input['member_id'] : null;

    if (!$email && !$memberId) {
        throw new Exception('Email or member_id is required');
    }

    // Get member info
    if ($memberId) {
        $stmt = $pdo->prepare("SELECT id, email, status, payment_status FROM members WHERE id = ?");
        $stmt->execute([$memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $emailLower = strtolower(trim($email));
        $stmt = $pdo->prepare("SELECT id, email, status, payment_status FROM members WHERE LOWER(email) = ?");
        $stmt->execute([$emailLower]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$member) {
        throw new Exception('Member not found');
    }

    $memberId = $member['id'];
    $memberEmail = strtolower(trim($member['email']));

    // Find and update all invitations for this member
    // Use multiple matching methods to ensure we find the invitation
    // First, try to find by email (most common case)
    $stmt = $pdo->prepare("
        UPDATE member_invitations 
        SET invitee_member_id = ?,
            registered_at = COALESCE(registered_at, NOW()),
            payed_at = CASE 
                WHEN ? = 'paid' AND payed_at IS NULL THEN NOW() 
                ELSE payed_at 
            END,
            approved_at = CASE 
                WHEN ? = 'approved' AND approved_at IS NULL THEN NOW() 
                ELSE approved_at 
            END,
            status = CASE
                WHEN ? = 'approved' THEN 'approved'
                WHEN ? = 'paid' AND status IN ('sent', 'registered') THEN 'payed'
                WHEN status = 'sent' THEN 'registered'
                ELSE status
            END
        WHERE LOWER(TRIM(invitee_email)) = ?
    ");
    
    $stmt->execute([
        $memberId,
        $member['payment_status'],
        $member['status'],
        $member['status'],
        $member['payment_status'],
        $memberEmail
    ]);
    
    $rowsUpdated = $stmt->rowCount();
    
    // Also update by member_id if different invitations exist
    if ($rowsUpdated === 0) {
        $stmt = $pdo->prepare("
            UPDATE member_invitations 
            SET registered_at = COALESCE(registered_at, NOW()),
                payed_at = CASE 
                    WHEN ? = 'paid' AND payed_at IS NULL THEN NOW() 
                    ELSE payed_at 
                END,
                approved_at = CASE 
                    WHEN ? = 'approved' AND approved_at IS NULL THEN NOW() 
                    ELSE approved_at 
                END,
                status = CASE
                    WHEN ? = 'approved' THEN 'approved'
                    WHEN ? = 'paid' AND status IN ('sent', 'registered') THEN 'payed'
                    WHEN status = 'sent' THEN 'registered'
                    ELSE status
                END
            WHERE invitee_member_id = ?
        ");
        
        $stmt->execute([
            $member['payment_status'],
            $member['status'],
            $member['status'],
            $member['payment_status'],
            $memberId
        ]);
        
        $rowsUpdated += $stmt->rowCount();
    }

    // Get updated invitations
    $stmt = $pdo->prepare("
        SELECT id, invitee_email, invitee_member_id, status, registered_at, payed_at, approved_at
        FROM member_invitations 
        WHERE LOWER(invitee_email) = ?
    ");
    $stmt->execute([$memberEmail]);
    $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => "Updated $rowsUpdated invitation(s)",
        'member' => $member,
        'invitations' => $invitations
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

