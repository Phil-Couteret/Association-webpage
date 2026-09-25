<?php
/**
 * Delete Admin User API
 * Accessible by any admin. Superadmin account cannot be deleted (prevents accidental lockout).
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection(null);
if (($_SESSION['admin_role'] ?? '') !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only superadmin can manage admin users']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = isset($input['id']) ? (int)$input['id'] : 0;
    if ($userId <= 0) {
        throw new Exception('User ID is required');
    }

    // Never allow deleting the superadmin account
    $checkStmt = $pdo->prepare("SELECT role FROM admin_users WHERE id = :id");
    $checkStmt->execute([':id' => $userId]);
    $target = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$target) {
        throw new Exception('User not found');
    }
    if ($target['role'] === 'superadmin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Cannot delete superadmin account.']);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM admin_users WHERE id = :id AND role != 'superadmin'");
    $stmt->execute([':id' => $userId]);
    if ($stmt->rowCount() === 0) {
        throw new Exception('User not found or could not be deleted');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Admin user deleted successfully'
    ]);
} catch (PDOException $e) {
    error_log("Database error in admin-users-delete: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
