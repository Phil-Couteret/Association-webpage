<?php
// Prevent any output before JSON
ob_start();

// Set error handler to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Fatal error: ' . $error['message'] . ' in ' . $error['file'] . ':' . $error['line']
        ]);
        exit;
    }
});

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

// Clear any output that might have been generated
ob_clean();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';

requireAdminSection(null);
if (($_SESSION['admin_role'] ?? '') !== 'superadmin') {
    $perms = $_SESSION['admin_permissions'] ?? [];
    if (!in_array('payment', $perms)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied to payment configuration']);
        exit;
    }
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    $gateway = $data['gateway'] ?? 'stripe';
    $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 0;
    $api_key_public = $data['api_key_public'] ?? null;
    $api_key_secret = $data['api_key_secret'] ?? null;
    $webhook_secret = $data['webhook_secret'] ?? null;
    $config_json = isset($data['config_json']) ? trim($data['config_json']) : null;
    
    // Normalize empty string to null
    if ($config_json === '') {
        $config_json = null;
    }
    
    // Validate gateway name
    if (empty($gateway)) {
        throw new Exception('Gateway name is required');
    }
    
    // Validate JSON config if provided
    if ($config_json !== null && $config_json !== '') {
        $decoded = json_decode($config_json);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON in config_json: ' . json_last_error_msg());
        }
    }
    
    // Check if gateway already exists
    try {
        $checkStmt = $pdo->prepare("SELECT id FROM payment_config WHERE gateway = ?");
        $checkStmt->execute([$gateway]);
        if ($checkStmt->fetch()) {
            throw new Exception('Payment gateway already exists');
        }
    } catch (PDOException $e) {
        throw new Exception('Database error checking gateway: ' . $e->getMessage());
    }
    
    // Insert new payment config
    try {
        $stmt = $pdo->prepare("
            INSERT INTO payment_config (
                gateway,
                is_active,
                api_key_public,
                api_key_secret,
                webhook_secret,
                config_json
            ) VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $gateway,
            $is_active,
            $api_key_public,
            $api_key_secret,
            $webhook_secret,
            $config_json
        ]);
        
        $configId = $pdo->lastInsertId();
        
        ob_clean(); // Ensure clean output
        echo json_encode([
            'success' => true,
            'message' => 'Payment configuration created successfully',
            'id' => $configId
        ]);
    } catch (PDOException $e) {
        throw new Exception('Database error inserting config: ' . $e->getMessage());
    }
    
} catch (PDOException $e) {
    ob_clean();
    error_log("Payment config create error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    ob_clean();
    error_log("Payment config create error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    ob_clean();
    error_log("Payment config create fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Fatal error: ' . $e->getMessage()
    ]);
}

