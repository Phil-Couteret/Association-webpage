<?php
ob_start();
session_start();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors-headers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ob_clean();

require_once __DIR__ . '/../classes/PaycometPayment.php';

if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please log in to make a payment.'
    ]);
    exit;
}

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

    $memberId = (int) $_SESSION['member_id'];
    $membershipType = $data['membership_type'] ?? null;
    $amount = isset($data['amount']) ? floatval($data['amount']) : null;
    $termsAccepted = !empty($data['terms_accepted']);

    if (!$termsAccepted) {
        throw new Exception('You must accept the Terms and Conditions and Privacy Policy to complete your membership payment.');
    }

    $validTypes = ['basic', 'sponsor', 'lifetime'];
    if (!in_array($membershipType, $validTypes)) {
        throw new Exception('Invalid membership type. Must be: basic, sponsor, or lifetime');
    }

    if ($amount === null || $amount <= 0) {
        switch ($membershipType) {
            case 'basic':
                $amount = 20.00;
                break;
            case 'sponsor':
            case 'lifetime':
                throw new Exception('Amount is required for ' . $membershipType . ' membership');
            default:
                throw new Exception('Invalid membership type');
        }
    }

    if ($amount < 20) {
        throw new Exception('Minimum amount is €20');
    }

    if ($amount == 20.00 && $membershipType !== 'basic') {
        $membershipType = 'basic';
    }
    if ($amount > 20.00 && $membershipType === 'basic') {
        $membershipType = 'sponsor';
    }

    $paycomet = new PaycometPayment($pdo);
    $order = $paycomet->createPaymentOrder($memberId, $membershipType, $amount, 'EUR');

    echo json_encode([
        'success' => true,
        'order_id' => $order['order_id'],
        'redirect_url' => $order['redirect_url'],
        'amount' => $order['amount'],
        'currency' => $order['currency'],
        'membership_type' => $membershipType,
    ]);
} catch (Exception $e) {
    error_log("Create Paycomet order error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} catch (PDOException $e) {
    error_log("Create Paycomet order PDO error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
