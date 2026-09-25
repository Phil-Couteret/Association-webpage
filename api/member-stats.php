<?php
require_once 'config.php';
require_once 'classes/SessionManager.php';

header('Content-Type: application/json');

$sessionManager = new SessionManager();
$sessionManager->startSession();

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

$memberId = $_SESSION['member_id'];

try {
    // Get member basic info
    $stmt = $pdo->prepare("SELECT created_at, membership_start_date, membership_end_date FROM members WHERE id = ?");
    $stmt->execute([$memberId]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$member) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Member not found'
        ]);
        exit;
    }
    
    // Calculate membership duration
    $membershipStart = $member['membership_start_date'] ? new DateTime($member['membership_start_date']) : new DateTime($member['created_at']);
    $now = new DateTime();
    $membershipDuration = $membershipStart->diff($now);
    $membershipDurationDays = $membershipStart->diff($now)->days;
    
    // Count invitations sent
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM invitations WHERE inviter_id = ?");
    $stmt->execute([$memberId]);
    $invitationsResult = $stmt->fetch(PDO::FETCH_ASSOC);
    $invitationsSent = (int)$invitationsResult['count'];
    
    // Count invitations that resulted in registered members
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT m.id) as count 
        FROM members m
        INNER JOIN invitations i ON m.inviter_id = i.inviter_id
        WHERE i.inviter_id = ? AND m.status = 'approved'
    ");
    $stmt->execute([$memberId]);
    $invitedMembersResult = $stmt->fetch(PDO::FETCH_ASSOC);
    $invitedMembers = (int)$invitedMembersResult['count'];
    
    // Count events attended (if member_events table exists)
    $eventsAttended = 0;
    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM member_events WHERE member_id = ? AND status = 'attended'");
        $stmt->execute([$memberId]);
        $eventsResult = $stmt->fetch(PDO::FETCH_ASSOC);
        $eventsAttended = (int)$eventsResult['count'];
    } catch (PDOException $e) {
        // Table might not exist yet, that's okay
        error_log("member_events table not found: " . $e->getMessage());
    }
    
    // Get last login (if login_logs table exists)
    $lastLogin = null;
    try {
        $stmt = $pdo->prepare("SELECT login_time FROM login_logs WHERE member_id = ? ORDER BY login_time DESC LIMIT 1");
        $stmt->execute([$memberId]);
        $loginResult = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($loginResult) {
            $lastLogin = $loginResult['login_time'];
        }
    } catch (PDOException $e) {
        // Table might not exist, that's okay
        error_log("login_logs table not found: " . $e->getMessage());
    }
    
    // Activity timeline (recent activities)
    $timeline = [];
    
    // Add membership start
    if ($member['membership_start_date']) {
        $timeline[] = [
            'date' => $member['membership_start_date'],
            'type' => 'membership_start',
            'title' => 'Membership Started',
            'description' => 'Your membership began'
        ];
    }
    
    // Add account creation
    $timeline[] = [
        'date' => $member['created_at'],
        'type' => 'account_created',
        'title' => 'Account Created',
        'description' => 'You joined Elektr-Âme'
    ];
    
    // Sort timeline by date (newest first)
    usort($timeline, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'membership_duration_days' => $membershipDurationDays,
            'membership_duration_formatted' => $membershipDuration->format('%y years, %m months, %d days'),
            'invitations_sent' => $invitationsSent,
            'invited_members' => $invitedMembers,
            'events_attended' => $eventsAttended,
            'last_login' => $lastLogin,
            'member_since' => $member['created_at'],
            'membership_start' => $member['membership_start_date']
        ],
        'timeline' => $timeline
    ]);
    
} catch (PDOException $e) {
    error_log("Member stats error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve member statistics'
    ]);
}

