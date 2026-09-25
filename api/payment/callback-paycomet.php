<?php
/**
 * Paycomet IPN / Callback handler
 * Receives server-to-server notification from Paycomet when payment completes.
 * No session – Paycomet calls this URL directly.
 *
 * TODO: Implement when Paycomet callback format is known.
 * - Verify signature/hash if provided
 * - Extract order_id, status, amount
 * - Update payment_transactions
 * - Update members
 * - Send confirmation emails
 *
 * Must be idempotent (duplicate callbacks should not double-update).
 */

ob_start();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/PaycometPayment.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

// Log raw input for debugging (remove in production)
$rawInput = file_get_contents('php://input');
error_log("Paycomet callback received: " . substr($rawInput, 0, 500));

$payload = json_decode($rawInput, true) ?: $_POST;

try {
    $paycomet = new PaycometPayment($pdo);

    if (!$paycomet->isConfigured()) {
        error_log("Paycomet callback: gateway not configured");
        http_response_code(503);
        exit('Paycomet not configured');
    }

    $result = $paycomet->processCallback($payload);

    if ($result['success']) {
        http_response_code(200);
        echo 'OK';
    } else {
        http_response_code(400);
        echo 'Invalid callback';
    }
} catch (Exception $e) {
    error_log("Paycomet callback error: " . $e->getMessage());
    http_response_code(500);
    echo 'Error';
}
