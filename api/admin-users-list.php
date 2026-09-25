<?php
/**
 * List Admin Users API
 * Accessible by any admin. Superadmin account is never returned (hidden from the list).
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
// Users section: superadmin only
requireAdminSection(null);
if (($_SESSION['admin_role'] ?? '') !== 'superadmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only superadmin can access user management']);
    exit;
}

try {
    // Superadmin account is never shown in the list
    $stmt = $pdo->prepare("
        SELECT id, email, name, role, permissions, is_active, created_at, last_login
        FROM admin_users
        WHERE role != 'superadmin'
        ORDER BY role DESC, email ASC
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $users = array_map(function ($row) {
        $perms = $row['permissions'] ?? null;
        $row['permissions'] = $perms ? (json_decode($perms, true) ?: []) : [];
        return $row;
    }, $rows);

    echo json_encode([
        'success' => true,
        'users' => $users
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-users-list: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
    ]);
}
?>

