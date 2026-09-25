<?php
/**
 * Member Accept Terms API
 * Records terms acceptance for members who haven't accepted yet (e.g. added by admin)
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/config.php';

$memberId = (int)$_SESSION['member_id'];
$termsVersion = '2026-01';

try {
    // Verify member exists and belongs to session
    $stmt = $pdo->prepare("SELECT id, terms_accepted_at FROM members WHERE id = ?");
    $stmt->execute([$memberId]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$member) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Member not found']);
        exit;
    }

    if (!empty($member['terms_accepted_at'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Terms already accepted',
            'terms_accepted_at' => $member['terms_accepted_at']
        ]);
        exit;
    }

    $updateStmt = $pdo->prepare("
        UPDATE members 
        SET terms_accepted_at = NOW(), terms_version = ?
        WHERE id = ?
    ");
    $updateStmt->execute([$termsVersion, $memberId]);

    $stmt = $pdo->prepare("SELECT terms_accepted_at FROM members WHERE id = ?");
    $stmt->execute([$memberId]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Terms accepted successfully',
        'terms_accepted_at' => $updated['terms_accepted_at']
    ]);

} catch (PDOException $e) {
    error_log("member-accept-terms.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
