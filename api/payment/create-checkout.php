<?php
// Prevent any output before JSON
ob_start();

session_start();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors-headers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Clear any output that might have been generated
ob_clean();

require_once __DIR__ . '/../classes/StripePayment.php';

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please log in to make a payment.'
    ]);
    exit;
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

    $memberId = $_SESSION['member_id'];
    $gateway = $data['gateway'] ?? 'stripe';
    $membershipType = $data['membership_type'] ?? null;
    $amount = isset($data['amount']) ? floatval($data['amount']) : null;
    $termsAccepted = !empty($data['terms_accepted']);

    // Require terms acceptance before payment (terms_accepted_at is set when payment completes)
    if (!$termsAccepted) {
        throw new Exception('You must accept the Terms and Conditions and Privacy Policy to complete your membership payment.');
    }

    // Validate membership type
    $validTypes = ['basic', 'sponsor', 'lifetime'];
    if (!in_array($membershipType, $validTypes)) {
        throw new Exception('Invalid membership type. Must be: basic, sponsor, or lifetime');
    }

    // Determine amount based on membership type if not provided
    if ($amount === null || $amount <= 0) {
        switch ($membershipType) {
            case 'basic':
                $amount = 20.00; // €20/year
                break;
            case 'sponsor':
            case 'lifetime':
                throw new Exception('Amount is required for ' . $membershipType . ' membership');
            default:
                throw new Exception('Invalid membership type');
        }
    }

    // Validate minimum amounts
    if ($amount < 20) {
        throw new Exception('Minimum amount is €20');
    }

    // If amount is exactly €20, it's basic membership
    if ($amount == 20.00 && $membershipType !== 'basic') {
        $membershipType = 'basic';
    }

    // If amount is above €20, it's sponsor membership (for tax deduction)
    if ($amount > 20.00 && $membershipType === 'basic') {
        $membershipType = 'sponsor';
    }

    if ($gateway === 'paycomet') {
        require_once __DIR__ . '/../classes/PaycometPayment.php';
        $paycomet = new PaycometPayment($pdo);
        $order = $paycomet->createPaymentOrder($memberId, $membershipType, $amount, 'EUR');
        echo json_encode([
            'success' => true,
            'gateway' => 'paycomet',
            'order_id' => $order['order_id'],
            'checkout_url' => $order['redirect_url'],
            'amount' => $order['amount'],
            'currency' => $order['currency'],
            'membership_type' => $membershipType,
        ]);
        exit;
    }

    // Tax receipt: personal or company (when member pays on behalf of company)
    $taxFiscalRecipient = $data['tax_fiscal_recipient'] ?? 'personal';
    $companyForTax = null;
    if ($taxFiscalRecipient === 'company' && !empty($data['company_name']) && !empty($data['company_cif'])) {
        $companyForTax = [
            'company_name' => trim($data['company_name']),
            'company_cif' => trim($data['company_cif']),
            'company_address' => isset($data['company_address']) ? trim($data['company_address']) : null,
        ];
    }

    if ($gateway === 'redsys') {
        require_once __DIR__ . '/../classes/RedsysPayment.php';
        $redsys = new RedsysPayment($pdo);
        $checkout = $redsys->createMembershipCheckout($memberId, $membershipType, $amount, 'EUR', $companyForTax);
        echo json_encode([
            'success' => true,
            'gateway' => 'redsys',
            'order_id' => $checkout['order_id'],
            'checkout_url' => $checkout['action'],
            'redsys_form' => [
                'action' => $checkout['action'],
                'Ds_SignatureVersion' => $checkout['Ds_SignatureVersion'],
                'Ds_MerchantParameters' => $checkout['Ds_MerchantParameters'],
                'Ds_Signature' => $checkout['Ds_Signature'],
            ],
            'amount' => $amount,
            'currency' => 'EUR',
            'membership_type' => $membershipType,
        ]);
        exit;
    }

    // Default: Stripe
    $stripe = new StripePayment($pdo);
    $checkout = $stripe->createCheckoutSessionHosted(
        $memberId,
        $membershipType,
        $amount,
        'EUR',
        $companyForTax
    );

    echo json_encode([
        'success' => true,
        'gateway' => 'stripe',
        'session_id' => $checkout['session_id'],
        'checkout_url' => $checkout['url'],
        'amount' => $checkout['amount'],
        'currency' => $checkout['currency'],
        'membership_type' => $membershipType,
    ]);
    
} catch (PDOException $e) {
    error_log("Create checkout PDO error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Create checkout error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

