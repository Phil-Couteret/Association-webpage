<?php
/**
 * GET: active member session? Used for header link + /member-login redirect (PHP session is already persistent).
 */
ob_start();

require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

ob_end_clean();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'authenticated' => false]);
    exit;
}

if (!isset($_SESSION['member_id'])) {
    echo json_encode([
        'success' => true,
        'authenticated' => false,
    ]);
    exit;
}

require_once __DIR__ . '/config.php';

try {
    $id = (int) $_SESSION['member_id'];
    $stmt = $pdo->prepare('SELECT id, first_name, second_name, email FROM members WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        unset($_SESSION['member_id'], $_SESSION['member_email'], $_SESSION['member_name'], $_SESSION['member_status'], $_SESSION['login_time']);
        echo json_encode(['success' => true, 'authenticated' => false]);
        exit;
    }
    echo json_encode([
        'success' => true,
        'authenticated' => true,
        'member' => [
            'id' => (int) $row['id'],
            'first_name' => $row['first_name'],
            'second_name' => $row['second_name'] ?? '',
            'email' => $row['email'],
        ],
    ]);
} catch (Exception $e) {
    error_log('member-auth-check: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'authenticated' => false]);
}
