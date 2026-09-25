<?php
/**
 * Create a members row from an Open Call submission (complimentary 1-year yearly membership).
 * Links promoted_member_id on the submission.
 */
session_start();

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
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
require_once __DIR__ . '/open-call-member-helper.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSections(['open_call', 'members']);

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['id'])) {
        throw new Exception('Submission id is required');
    }

    $id = (int)$input['id'];
    $result = open_call_sync_member_from_submission($pdo, $id);

    if (!empty($result['error'])) {
        throw new Exception($result['error']);
    }

    if (!empty($result['skipped']) && empty($result['alreadyLinked'])) {
        throw new Exception($result['message'] ?? 'Could not create member from this submission');
    }

    $out = [
        'success' => true,
        'memberId' => $result['memberId'] ?? null,
        'createdNew' => !empty($result['createdNew']),
        'alreadyLinked' => !empty($result['alreadyLinked']),
        'message' => $result['message'] ?? 'OK',
        'linkStored' => $result['linkStored'] ?? true,
    ];
    if (isset($result['linkStored']) && $result['linkStored'] === false) {
        $out['warning'] =
            'Member was saved. Add DB column promoted_member_id (see database/alter-open-call-promoted-member-id.sql) to show the link on this Open Call row.';
    }
    echo json_encode($out);
} catch (PDOException $e) {
    error_log('open-call-promote-to-member: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
