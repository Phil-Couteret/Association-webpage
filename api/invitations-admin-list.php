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
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('invitations');

try {

    // Get query parameters for filtering
    $statusFilter = $_GET['status'] ?? 'all';
    $daysOld = isset($_GET['days_old']) ? (int)$_GET['days_old'] : null;

    // Build query
    $sql = "
        SELECT 
            mi.id,
            mi.inviter_id,
            mi.invitee_first_name,
            mi.invitee_email,
            mi.status,
            mi.email_sent,
            mi.email_sent_at,
            mi.email_error,
            mi.invitee_member_id,
            mi.sent_at,
            mi.registered_at,
            mi.payed_at,
            mi.approved_at,
            mi.created_at,
            m.first_name as inviter_first_name,
            m.second_name as inviter_second_name,
            m.email as inviter_email
        FROM member_invitations mi
        LEFT JOIN members m ON mi.inviter_id = m.id
        WHERE 1=1
    ";

    $params = [];

    // Apply status filter
    if ($statusFilter !== 'all') {
        $sql .= " AND mi.status = ?";
        $params[] = $statusFilter;
    }

    // Filter by age (days old)
    if ($daysOld !== null && $daysOld > 0) {
        $sql .= " AND mi.sent_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
        $params[] = $daysOld;
    }

    // Filter by email sent status
    if (isset($_GET['email_sent'])) {
        $emailSent = $_GET['email_sent'] === 'true' ? 1 : 0;
        $sql .= " AND mi.email_sent = ?";
        $params[] = $emailSent;
    }

    $sql .= " ORDER BY mi.sent_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $invitations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get statistics
    $statsStmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
            SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registered_count,
            SUM(CASE WHEN status = 'payed' THEN 1 ELSE 0 END) as payed_count,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN email_sent = 1 THEN 1 ELSE 0 END) as email_sent_count,
            SUM(CASE WHEN email_sent = 0 THEN 1 ELSE 0 END) as email_not_sent_count,
            SUM(CASE WHEN sent_at < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) as old_count
        FROM member_invitations
    ");
    $statsStmt->execute();
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'invitations' => $invitations,
        'statistics' => $stats
    ]);

} catch (PDOException $e) {
    error_log("Database error in invitations-admin-list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
}
?>

