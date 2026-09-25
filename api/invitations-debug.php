<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    $email = $_GET['email'] ?? null;
    $memberId = isset($_GET['member_id']) ? (int)$_GET['member_id'] : null;

    $debug = [];

    if ($email) {
        $emailLower = strtolower(trim($email));
        $debug['search_email'] = $emailLower;
        
        // Find member by email
        $stmt = $pdo->prepare("SELECT id, email, status, payment_status FROM members WHERE LOWER(email) = ?");
        $stmt->execute([$emailLower]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
        $debug['member'] = $member;
        
        if ($member) {
            // Find invitations for this email
            $stmt = $pdo->prepare("
                SELECT 
                    id, inviter_id, invitee_email, invitee_member_id, status, 
                    sent_at, registered_at, payed_at, approved_at
                FROM member_invitations 
                WHERE LOWER(invitee_email) = ?
            ");
            $stmt->execute([$emailLower]);
            $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $debug['invitations'] = $invitations;
            
            // Check if invitee_member_id matches
            foreach ($invitations as $inv) {
                if ($inv['invitee_member_id'] != $member['id']) {
                    $debug['mismatch'][] = [
                        'invitation_id' => $inv['id'],
                        'invitee_member_id' => $inv['invitee_member_id'],
                        'actual_member_id' => $member['id']
                    ];
                }
            }
        }
    }

    if ($memberId) {
        $debug['search_member_id'] = $memberId;
        
        // Find member
        $stmt = $pdo->prepare("SELECT id, email, status, payment_status FROM members WHERE id = ?");
        $stmt->execute([$memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
        $debug['member'] = $member;
        
        if ($member) {
            $emailLower = strtolower(trim($member['email']));
            
            // Find invitations by member_id
            $stmt = $pdo->prepare("
                SELECT 
                    id, inviter_id, invitee_email, invitee_member_id, status, 
                    sent_at, registered_at, payed_at, approved_at
                FROM member_invitations 
                WHERE invitee_member_id = ?
            ");
            $stmt->execute([$memberId]);
            $invitationsByMemberId = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $debug['invitations_by_member_id'] = $invitationsByMemberId;
            
            // Find invitations by email
            $stmt = $pdo->prepare("
                SELECT 
                    id, inviter_id, invitee_email, invitee_member_id, status, 
                    sent_at, registered_at, payed_at, approved_at
                FROM member_invitations 
                WHERE LOWER(invitee_email) = ?
            ");
            $stmt->execute([$emailLower]);
            $invitationsByEmail = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $debug['invitations_by_email'] = $invitationsByEmail;
        }
    }

    echo json_encode([
        'success' => true,
        'debug' => $debug
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

