<?php
/**
 * Returns list of active payment gateways (names only, no secrets).
 * Used by PaymentCheckout to show gateway options.
 */
ob_start();
session_start();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors-headers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_clean();

try {
    $stmt = $pdo->query("
        SELECT gateway FROM payment_config
        WHERE is_active = 1
        ORDER BY gateway ASC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode([
        'success' => true,
        'gateways' => $rows ?: ['stripe'],
    ]);
} catch (PDOException $e) {
    error_log("Active gateways error: " . $e->getMessage());
    echo json_encode([
        'success' => true,
        'gateways' => ['stripe'],
    ]);
}
