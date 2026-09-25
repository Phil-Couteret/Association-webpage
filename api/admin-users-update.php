<?php
/**
 * Update Admin User API
 * Accessible by any admin. Superadmin account cannot be modified (prevents accidental lockout).
 */

session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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
    
    if (!$input || empty($input['id'])) {
        throw new Exception('User ID is required');
    }
    
    $userId = (int)$input['id'];
    $isSelf = ($_SESSION['admin_id'] == $userId);
    
    $checkStmt = $pdo->prepare("SELECT role FROM admin_users WHERE id = :id");
    $checkStmt->execute([':id' => $userId]);
    $target = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$target) {
        throw new Exception('User not found');
    }
    
    // Superadmin account: only the owner can update it, and only name/email/password (no deactivate, no role change)
    if ($target['role'] === 'superadmin') {
        if (!$isSelf) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Cannot modify superadmin account.']);
            exit();
        }
        $input['is_active'] = null;
        $input['role'] = null;
    }
    
    // Only superadmin can assign superadmin role (and cannot change own role)
    if (isset($input['role']) && $input['role'] === 'superadmin' && $_SESSION['admin_role'] !== 'superadmin') {
        unset($input['role']);
    }
    if ($isSelf && isset($input['role'])) {
        unset($input['role']);
    }
    if ($isSelf && isset($input['is_active'])) {
        unset($input['is_active']);
    }
    
    // Build update query dynamically based on provided fields
    $updates = [];
    $params = [':id' => $userId];
    
    if (isset($input['name']) && !empty($input['name'])) {
        $updates[] = "name = :name";
        $params[':name'] = trim($input['name']);
    }
    
    if (isset($input['email']) && !empty($input['email'])) {
        $email = filter_var(trim($input['email']), FILTER_SANITIZE_EMAIL);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        $emailDomain = substr(strrchr($email, "@"), 1);
        if (strtolower($emailDomain) !== 'elektr-ame.com') {
            throw new Exception('Only @elektr-ame.com email addresses are allowed');
        }
        $dupStmt = $pdo->prepare("SELECT id FROM admin_users WHERE email = :email AND id != :id");
        $dupStmt->execute([':email' => $email, ':id' => $userId]);
        if ($dupStmt->fetch()) {
            throw new Exception('Email already in use');
        }
        $updates[] = "email = :email";
        $params[':email'] = $email;
    }
    
    if (isset($input['is_active'])) {
        $updates[] = "is_active = :is_active";
        $params[':is_active'] = $input['is_active'] ? 1 : 0;
    }
    
    if (isset($input['role']) && in_array($input['role'], ['admin', 'superadmin'])) {
        $updates[] = "role = :role";
        $params[':role'] = $input['role'];
    }

    if (isset($input['permissions']) && is_array($input['permissions']) && $target['role'] === 'admin') {
        $colCheck = $pdo->query("SHOW COLUMNS FROM admin_users LIKE 'permissions'");
        if ($colCheck && $colCheck->rowCount() > 0) {
            $validSections = ['events','artists','gallery','members','newsletter','email_automation','invitations','payment','open_call'];
            $perms = array_values(array_unique(array_intersect($input['permissions'], $validSections)));
            $updates[] = "permissions = :permissions";
            $params[':permissions'] = json_encode($perms);
        }
    }
    
    if (isset($input['password']) && !empty($input['password'])) {
        $updates[] = "password_hash = :password_hash";
        $params[':password_hash'] = password_hash($input['password'], PASSWORD_DEFAULT);
    }
    
    if (empty($updates)) {
        throw new Exception('No fields to update');
    }
    
    $sql = "UPDATE admin_users SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin user updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-users-update: " . $e->getMessage());
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

