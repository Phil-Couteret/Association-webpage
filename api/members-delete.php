<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {

    $input = json_decode(file_get_contents('php://input'), true);
    $memberId = $input['member_id'] ?? null;

    if (!$memberId) {
        throw new Exception('Member ID is required');
    }

    // First, get member details for logging
    $stmt = $pdo->prepare("SELECT first_name, last_name, email FROM members WHERE id = :memberId");
    $stmt->execute([':memberId' => $memberId]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$member) {
        throw new Exception('Member not found');
    }

    // Delete the member
    $stmt = $pdo->prepare("DELETE FROM members WHERE id = :memberId");
    $stmt->execute([':memberId' => $memberId]);

    echo json_encode([
        'success' => true, 
        'message' => 'Member deleted successfully',
        'deleted_member' => $member['first_name'] . ' ' . $member['last_name']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>






