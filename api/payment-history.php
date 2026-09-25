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

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

$memberId = $_SESSION['member_id'];

// Register shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error occurred'
        ]);
    }
});

try {
    // Check if payment_transactions table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'payment_transactions'");
    $tableExists = $tableCheck && $tableCheck->rowCount() > 0;
    
    $transactions = [];
    
    if ($tableExists) {
        // Get payment history from payment_transactions table
        $stmt = $pdo->prepare("
            SELECT 
                id,
                transaction_id,
                payment_gateway,
                amount,
                currency,
                status,
                membership_type,
                membership_start_date,
                membership_end_date,
                payment_method,
                created_at,
                updated_at
            FROM payment_transactions
            WHERE member_id = ?
            ORDER BY created_at DESC
        ");
        
        $stmt->execute([$memberId]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Build payment history array
    $paymentHistory = [];
    
    foreach ($transactions as $transaction) {
        $paymentHistory[] = [
            'id' => $transaction['id'],
            'transaction_id' => $transaction['transaction_id'],
            'date' => $transaction['created_at'],
            'amount' => floatval($transaction['amount']),
            'currency' => $transaction['currency'] ?? 'EUR',
            'status' => $transaction['status'],
            'membership_type' => $transaction['membership_type'],
            'membership_start' => $transaction['membership_start_date'],
            'membership_end' => $transaction['membership_end_date'],
            'payment_method' => $transaction['payment_method'],
            'gateway' => $transaction['payment_gateway'],
            'type' => 'membership',
            'description' => ucfirst($transaction['membership_type']) . ' membership payment',
            'created_at' => $transaction['created_at']
        ];
    }
    
    // If no transactions but member has payment info, include legacy payment
    if (empty($paymentHistory)) {
        $memberStmt = $pdo->prepare("
            SELECT 
                payment_amount,
                last_payment_date,
                payment_status,
                membership_type,
                membership_start_date,
                membership_end_date
            FROM members
            WHERE id = ?
        ");
        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($member && $member['last_payment_date'] && $member['payment_amount']) {
            $paymentHistory[] = [
                'id' => 0,
                'transaction_id' => 'legacy',
                'date' => $member['last_payment_date'],
                'amount' => floatval($member['payment_amount']),
                'currency' => 'EUR',
                'status' => $member['payment_status'],
                'membership_type' => $member['membership_type'],
                'membership_start' => $member['membership_start_date'],
                'membership_end' => $member['membership_end_date'],
                'payment_method' => 'manual',
                'gateway' => 'manual',
                'type' => 'membership',
                'description' => ucfirst($member['membership_type']) . ' membership payment (manual)',
                'created_at' => $member['last_payment_date']
            ];
        }
    }
    
    // Clear output buffer before JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'payments' => $paymentHistory,
        'total_payments' => count($paymentHistory),
        'total_amount' => array_sum(array_column($paymentHistory, 'amount')),
        'message' => count($paymentHistory) > 0 
            ? 'Payment history retrieved successfully' 
            : 'No payment history available.'
    ]);
    
} catch (PDOException $e) {
    error_log("Payment history PDO error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Payment history error: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve payment history: ' . $e->getMessage()
    ]);
}

