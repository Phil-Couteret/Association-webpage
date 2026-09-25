<?php
// Quick fix script for invitation linking
// Usage: POST with {"email": "email@example.com"} or {"member_id": 123}

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
        $stmt = $pdo->prepare("SELECT id, email, status, payment_status, inviter_id FROM members WHERE id = ?");
        $stmt->execute([$memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $emailLower = strtolower(trim($email));
        $stmt = $pdo->prepare("SELECT id, email, status, payment_status, inviter_id FROM members WHERE LOWER(email) = ?");
        $stmt->execute([$emailLower]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$member) {
        throw new Exception('Member not found');
    }

    $memberId = $member['id'];
    $memberEmail = strtolower(trim($member['email']));
    $inviterId = $member['inviter_id'];

    // Find all invitations for this member
    $findStmt = $pdo->prepare("
        SELECT id, inviter_id, invitee_email, invitee_member_id, status 
        FROM member_invitations 
        WHERE LOWER(TRIM(invitee_email)) = ? 
           OR invitee_member_id = ?
           OR (inviter_id = ? AND LOWER(TRIM(invitee_email)) = ?)
    ");
    $findStmt->execute([$memberEmail, $memberId, $inviterId, $memberEmail]);
    $existingInvitations = $findStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalUpdated = 0;

    // Update each invitation found
    foreach ($existingInvitations as $inv) {
        $invId = $inv['id'];
        
        // Determine the correct status based on member's current state
        $newStatus = 'sent';
        if ($member['status'] === 'approved') {
            $newStatus = 'approved';
        } elseif ($member['payment_status'] === 'paid') {
            $newStatus = 'payed';
        } elseif ($inv['invitee_member_id'] == $memberId || $inv['invitee_member_id'] === null) {
            $newStatus = 'registered';
        }

        $updateStmt = $pdo->prepare("
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
                status = ?
            WHERE id = ?
        ");
        
        $updateStmt->execute([
            $memberId,
            $member['payment_status'],
            $member['status'],
            $newStatus,
            $invId
        ]);
        
        $totalUpdated += $updateStmt->rowCount();
    }

    // Get updated invitations
    $stmt = $pdo->prepare("
        SELECT id, inviter_id, invitee_email, invitee_member_id, status, 
               registered_at, payed_at, approved_at
        FROM member_invitations 
        WHERE LOWER(TRIM(invitee_email)) = ? OR invitee_member_id = ?
        ORDER BY id DESC
    ");
    $stmt->execute([$memberEmail, $memberId]);
    $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => "Updated $totalUpdated invitation(s) for member $memberId ($memberEmail)",
        'member' => $member,
        'invitations' => $invitations,
        'found_before' => count($existingInvitations)
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

