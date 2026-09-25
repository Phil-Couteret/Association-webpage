<?php
// Prevent any output before JSON
ob_start();

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

// Clear any output that might have been generated
ob_clean();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';

// Payment section: superadmin or admin with 'payment' permission
requireAdminSection(null); // require login
if (($_SESSION['admin_role'] ?? '') !== 'superadmin') {
    $perms = $_SESSION['admin_permissions'] ?? [];
    if (!in_array('payment', $perms)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied to payment configuration']);
        exit;
    }
}

try {
    // Try to query the table directly - if it doesn't exist, catch the error
    $stmt = $pdo->query("
        SELECT 
            id,
            gateway,
            is_active,
            api_key_public,
            api_key_secret,
            webhook_secret,
            config_json,
            created_at,
            updated_at
        FROM payment_config
        ORDER BY gateway ASC
    ");
    
    $configs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Don't mask here - let frontend handle masking for display
    // Full keys are needed when editing
    
    echo json_encode([
        'success' => true,
        'configs' => $configs
    ]);
    
} catch (PDOException $e) {
    error_log("Payment config list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to retrieve payment configurations: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Payment config list error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

