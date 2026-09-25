<?php
/**
 * Get email automation statistics for admin panel
 */

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

// Check authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/EmailAutomation.php';

try {
    $days = isset($_GET['days']) ? intval($_GET['days']) : 30;

    $emailAutomation = new EmailAutomation($pdo);

    // Get statistics
    $stats = $emailAutomation->getStatistics($days);

    // Get queue status
    $stmt = $pdo->query("
        SELECT 
            status,
            priority,
            COUNT(*) as count,
            MIN(scheduled_for) as next_scheduled
        FROM email_queue
        GROUP BY status, priority
        ORDER BY 
            CASE status WHEN 'pending' THEN 1 WHEN 'processing' THEN 2 WHEN 'sent' THEN 3 ELSE 4 END,
            CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 END
    ");
    $queueStatus = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get recent emails
    $stmt = $pdo->prepare("
        SELECT 
            el.*,
            m.first_name,
            m.second_name
        FROM email_logs el
        LEFT JOIN members m ON el.member_id = m.id
        ORDER BY el.sent_at DESC
        LIMIT 50
    ");
    $stmt->execute();
    $recentEmails = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get automation rules
    $stmt = $pdo->query("
        SELECT 
            ear.*,
            et.name as template_name,
            et.template_key
        FROM email_automation_rules ear
        JOIN email_templates et ON ear.template_id = et.id
        ORDER BY ear.trigger_type
    ");
    $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'statistics' => $stats,
        'queue_status' => $queueStatus,
        'recent_emails' => $recentEmails,
        'automation_rules' => $rules
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

