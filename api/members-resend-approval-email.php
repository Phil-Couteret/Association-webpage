<?php
/**
 * Resend the "member_approved" template to an approved member (admin only).
 */
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('members');

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$memberId = isset($input['member_id']) ? (int) $input['member_id'] : 0;
if ($memberId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid member_id']);
    exit();
}

try {
    require_once __DIR__ . '/classes/EmailAutomation.php';
    $emailAutomation = new EmailAutomation($pdo);
    $result = $emailAutomation->resendMemberStatusEmail($memberId, 'member_approved');
    if (empty($result['ok'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $result['message'] ?? 'Failed to send email']);
        exit();
    }
    echo json_encode(['success' => true, 'message' => $result['message'] ?? 'Email sent']);
} catch (Exception $e) {
    error_log('members-resend-approval-email: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
