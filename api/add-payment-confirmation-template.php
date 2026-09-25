<?php
/**
 * Add Payment Confirmation Email Template
 * Run this script once to add the payment_confirmation template
 */

require_once __DIR__ . '/config.php';

try {
    $sql = file_get_contents(__DIR__ . '/../database/add-payment-confirmation-template.sql');
    
    // Execute SQL
    $pdo->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Payment confirmation email template added successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Add payment confirmation template error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

