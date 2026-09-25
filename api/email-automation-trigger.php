<?php
/**
 * Manually trigger email automation
 * Used by system events (member approval, renewal, etc.)
 */

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

// Check if user is admin (for manual triggers)
$isAdmin = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid input');
    }

    $triggerType = $input['trigger_type'] ?? null;
    $memberId = $input['member_id'] ?? null;

    if (!$triggerType || !$memberId) {
        throw new Exception('Missing required fields');
    }

    // Valid trigger types
    $validTriggers = [
        'member_registered',
        'member_approved',
        'member_rejected',
        'membership_renewed',
        'sponsor_tax_receipt'
    ];

    if (!in_array($triggerType, $validTriggers)) {
        throw new Exception('Invalid trigger type');
    }

    // Initialize email automation
    $emailAutomation = new EmailAutomation($pdo);

    // Trigger automation
    $result = $emailAutomation->triggerAutomation($triggerType, $memberId);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Email automation triggered successfully'
        ]);
    } else {
        throw new Exception('Failed to trigger automation');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

