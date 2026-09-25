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
    
    $id = $data['id'] ?? null;
    
    if (!$id) {
        throw new Exception('Configuration ID is required');
    }
    
    // Get existing config to merge with updates
    try {
        $getStmt = $pdo->prepare("SELECT * FROM payment_config WHERE id = ?");
        $getStmt->execute([$id]);
        $existing = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            throw new Exception('Payment configuration not found');
        }
    } catch (PDOException $e) {
        throw new Exception('Database error fetching config: ' . $e->getMessage());
    }
    
    // Only update fields that are provided (non-empty)
    $is_active = isset($data['is_active']) ? (int)$data['is_active'] : $existing['is_active'];
    $api_key_public = !empty($data['api_key_public']) ? $data['api_key_public'] : $existing['api_key_public'];
    $api_key_secret = !empty($data['api_key_secret']) ? $data['api_key_secret'] : $existing['api_key_secret'];
    $webhook_secret = !empty($data['webhook_secret']) ? $data['webhook_secret'] : $existing['webhook_secret'];
    
    // Handle config_json - normalize empty string to null
    if (isset($data['config_json'])) {
        $config_json = trim($data['config_json']);
        if ($config_json === '') {
            $config_json = null;
        }
    } else {
        $config_json = $existing['config_json'];
    }
    
    // Validate JSON config if provided
    if ($config_json !== null && $config_json !== '') {
        $decoded = json_decode($config_json);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON in config_json: ' . json_last_error_msg());
        }
    }
    
    // Update payment config
    try {
        $stmt = $pdo->prepare("
            UPDATE payment_config SET
                is_active = ?,
                api_key_public = ?,
                api_key_secret = ?,
                webhook_secret = ?,
                config_json = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $stmt->execute([
            $is_active,
            $api_key_public,
            $api_key_secret,
            $webhook_secret,
            $config_json,
            $id
        ]);
        
        ob_clean(); // Ensure clean output
        echo json_encode([
            'success' => true,
            'message' => 'Payment configuration updated successfully',
            'rows_affected' => $stmt->rowCount()
        ]);
    } catch (PDOException $e) {
        throw new Exception('Database error updating config: ' . $e->getMessage());
    }
    
} catch (PDOException $e) {
    ob_clean();
    error_log("Payment config update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    ob_clean();
    error_log("Payment config update error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (Throwable $e) {
    ob_clean();
    error_log("Payment config update fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Fatal error: ' . $e->getMessage()
    ]);
}

