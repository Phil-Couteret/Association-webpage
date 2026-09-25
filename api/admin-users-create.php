<?php
/**
 * Create Admin User API
 * Accessible by any admin. Only superadmin can create another superadmin.
 * Regular admins can only create Admin users.
 */

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    if (!$input || empty($input['email']) || empty($input['password']) || empty($input['name'])) {
        throw new Exception('Email, password, and name are required');
    }
    
    $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
    $name = trim($input['name']);
    $role = $input['role'] ?? 'admin';
    $passwordInput = $input['password'];
    $permissions = $input['permissions'] ?? [];
    if (!is_array($permissions)) $permissions = [];
    $validSections = ['events','artists','gallery','members','newsletter','email_automation','invitations','payment','open_call'];
    $permissions = array_values(array_unique(array_intersect($permissions, $validSections)));
    $permissionsJson = json_encode($permissions);

    // Validate role: only superadmin can create another superadmin
    if (!in_array($role, ['admin', 'superadmin'])) {
        throw new Exception('Invalid role');
    }
    if ($role === 'superadmin' && ($_SESSION['admin_role'] ?? '') !== 'superadmin') {
        $role = 'admin'; // Downgrade to admin if requester is not superadmin
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }

    // Restrict to @elektr-ame.com domain
    $emailDomain = substr(strrchr($email, "@"), 1);
    if (strtolower($emailDomain) !== 'elektr-ame.com') {
        throw new Exception('Only @elektr-ame.com email addresses are allowed');
    }
    
    // Check if email already exists
    $checkStmt = $pdo->prepare("SELECT id FROM admin_users WHERE email = :email");
    $checkStmt->execute([':email' => $email]);
    if ($checkStmt->fetch()) {
        throw new Exception('Email already exists');
    }
    
    // Hash password
    $passwordHash = password_hash($passwordInput, PASSWORD_DEFAULT);
    
    // Insert new admin user (permissions only for admin role)
    $hasPermCol = false;
    try {
        $colCheck = $pdo->query("SHOW COLUMNS FROM admin_users LIKE 'permissions'");
        $hasPermCol = $colCheck && $colCheck->rowCount() > 0;
    } catch (Exception $e) { /* ignore */ }

    $permCol = $hasPermCol ? ', permissions' : '';
    $permVal = $hasPermCol ? ', :permissions' : '';
    $stmt = $pdo->prepare("
        INSERT INTO admin_users (email, password_hash, name, role, created_by $permCol)
        VALUES (:email, :password_hash, :name, :role, :created_by $permVal)
    ");
    $params = [
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':name' => $name,
        ':role' => $role,
        ':created_by' => $_SESSION['admin_id']
    ];
    if ($hasPermCol) $params[':permissions'] = $permissionsJson;
    $stmt->execute($params);
    
    $newUserId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Admin user created successfully',
        'user_id' => $newUserId
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in admin-users-create: " . $e->getMessage());
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

