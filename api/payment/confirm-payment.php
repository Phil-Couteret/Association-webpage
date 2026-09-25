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
require_once __DIR__ . '/../classes/PaycometPayment.php';
require_once __DIR__ . '/../classes/RedsysPayment.php';
require_once __DIR__ . '/../classes/EmailAutomation.php';

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
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

    $sessionId = $data['session_id'] ?? null;
    $orderId = $data['order_id'] ?? null;
    $gateway = $data['gateway'] ?? null;

    // RedSys return: gateway=redsys + order_id (member + emails handled in redsys-notification.php)
    if ($gateway === 'redsys' && $orderId) {
        $redsys = new RedsysPayment($pdo);
        $result = $redsys->getCompletedTransactionByOrder($orderId);
        if (!$result) {
            throw new Exception('Payment not found or not yet confirmed. If you just completed the payment, wait a few seconds and refresh this page.');
        }
        if ((int) $result['member_id'] !== (int) $_SESSION['member_id']) {
            throw new Exception('This payment does not belong to your account.');
        }
        $amount = (float) $result['amount'];
        $membershipType = ($result['membership_type'] ?? 'basic') === 'lifetime' ? 'lifetime' : 'yearly';
        $membershipStartDate = $result['membership_start_date'] ?? date('Y-m-d');
        $membershipEndDate = $result['membership_end_date'] ?? null;

        echo json_encode([
            'success' => true,
            'message' => 'Payment confirmed successfully',
            'membership_type' => $membershipType,
            'amount' => $amount,
            'membership_start_date' => $membershipStartDate,
            'membership_end_date' => $membershipEndDate,
        ]);
        exit;
    }

    // Paycomet flow: order_id or gateway=paycomet (not RedSys)
    if ($gateway === 'paycomet' || ($orderId && $gateway !== 'redsys')) {
        $orderId = $orderId ?: $sessionId;
        if (!$orderId) {
            throw new Exception('Order ID is required for Paycomet');
        }
        $paycomet = new PaycometPayment($pdo);
        $result = $paycomet->confirmOrderOnReturn($orderId);
        if (!$result) {
            throw new Exception('Payment not found or not yet confirmed. The callback may still be processing.');
        }
        $memberId = (int) $result['member_id'];
        $amount = (float) $result['amount'];
        $membershipType = ($result['membership_type'] ?? 'basic') === 'lifetime' ? 'lifetime' : 'yearly';
        $membershipStartDate = $result['membership_start_date'] ?? date('Y-m-d');
        $membershipEndDate = $result['membership_end_date'] ?? null;

        // Member may already be updated by callback; ensure consistency
        $updateStmt = $pdo->prepare("
            UPDATE members SET
                membership_type = ?, membership_start_date = ?, membership_end_date = ?,
                payment_status = 'paid', payment_amount = ?, last_payment_date = CURDATE(), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $updateStmt->execute([$membershipType, $membershipStartDate, $membershipEndDate, $amount, $memberId]);

        $memberStmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        if ($member) {
            $emailAutomation = new EmailAutomation($pdo);
            $isFirstPayment = empty($member['last_payment_date']);
            if ($isFirstPayment) {
                $emailAutomation->queueEmail($member['email'], $member['first_name'] . ' ' . $member['last_name'], 'member_welcome', ['first_name' => $member['first_name'], 'membership_type' => ucfirst($membershipType)], $memberId, 'high');
            }
            $emailAutomation->queueEmail($member['email'], $member['first_name'] . ' ' . $member['last_name'], 'payment_confirmation', ['first_name' => $member['first_name'], 'amount' => number_format($amount, 2), 'membership_type' => ucfirst($membershipType), 'date' => date('Y-m-d')], $memberId, 'high');
            $memberCountry = $member['country'] ?? '';
            $isSpain = $emailAutomation->isSpainResident($memberCountry);
            if ($amount >= 20 && $isSpain) {
                $memberForTax = array_merge($member, ['payment_amount' => $amount, 'membership_type' => $membershipType]);
                $variables = $emailAutomation->preparePaymentTaxVariables($memberForTax);
                $emailAutomation->sendTaxReceiptPdf($memberId, $variables);
            }
            $emailAutomation->processQueue(10);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Payment confirmed successfully',
            'membership_type' => $membershipType,
            'amount' => $amount,
            'membership_start_date' => $membershipStartDate,
            'membership_end_date' => $membershipEndDate,
        ]);
        exit;
    }

    // Stripe flow: session_id
    if (!$sessionId) {
        throw new Exception('Session ID or Order ID is required');
    }

    $stripe = new StripePayment($pdo);
    
    // Get checkout session from Stripe
    $session = $stripe->getCheckoutSession($sessionId);
    
    if (!$session) {
        throw new Exception('Checkout session not found');
    }
    
    // Check payment status
    if ($session['payment_status'] !== 'paid') {
        throw new Exception('Payment not completed. Status: ' . $session['payment_status']);
    }
    
    // Get metadata - payment results in yearly (basic/sponsor) or lifetime
    $metadata = $session['metadata'] ?? [];
    $memberId = isset($metadata['member_id']) ? (int)$metadata['member_id'] : null;
    $txMembershipType = $metadata['membership_type'] ?? null;
    $membershipType = ($txMembershipType === 'lifetime') ? 'lifetime' : 'yearly';
    $membershipStartDate = $metadata['membership_start_date'] ?? date('Y-m-d');
    $membershipEndDate = $metadata['membership_end_date'] ?? null;
    
    if (!$memberId || !$txMembershipType) {
        throw new Exception('Invalid session metadata');
    }
    
    // Verify member ID matches logged-in user (if session exists)
    // Note: Session might be lost after Stripe redirect, which is normal
    // We trust the metadata since it was set by us when creating the checkout session
    // The webhook will also verify and update the member status
    if (isset($_SESSION['member_id'])) {
        $sessionMemberId = (int)$_SESSION['member_id'];
        if ($memberId !== $sessionMemberId) {
            // Log the mismatch for security audit, but proceed
            // This can happen if user logged in as different account after starting payment
            error_log("Payment confirmation: Member ID mismatch. Session: {$sessionMemberId}, Metadata: {$memberId}. Proceeding with metadata.");
        }
    }
    // If no session, that's fine - session often lost after external redirect
    // We proceed with the member_id from metadata (which we set ourselves)
    
    // Get amount from session
    $amount = $session['amount_total'] / 100; // Convert from cents
    
    // Update transaction status
    $stripe->updateTransactionStatus(
        $sessionId,
        'completed',
        null,
        json_encode($session)
    );
    
    // Update member record
    $updateStmt = $pdo->prepare("
        UPDATE members SET
            membership_type = ?,
            membership_start_date = ?,
            membership_end_date = ?,
            payment_status = 'paid',
            payment_amount = ?,
            last_payment_date = CURDATE(),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    
    $updateStmt->execute([
        $membershipType,
        $membershipStartDate,
        $membershipEndDate,
        $amount,
        $memberId
    ]);
    
    // Get member data for email
    $memberStmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
    $memberStmt->execute([$memberId]);
    $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
    
    // Send confirmation email
    if ($member) {
        $emailAutomation = new EmailAutomation($pdo);
        
        // Determine if this is first payment or renewal
        $isFirstPayment = empty($member['last_payment_date']);
        
        if ($isFirstPayment) {
            // Send welcome email
            $emailAutomation->queueEmail(
                $member['email'],
                $member['first_name'] . ' ' . $member['last_name'],
                'member_welcome',
                [
                    'first_name' => $member['first_name'],
                    'membership_type' => ucfirst($membershipType),
                ],
                $memberId,
                'high'
            );
        }
        
        // Send payment confirmation
        $emailAutomation->queueEmail(
            $member['email'],
            $member['first_name'] . ' ' . $member['last_name'],
            'payment_confirmation',
            [
                'first_name' => $member['first_name'],
                'amount' => number_format($amount, 2),
                'membership_type' => ucfirst($membershipType),
                'date' => date('Y-m-d'),
            ],
            $memberId,
            'high'
        );
        
        // Tax receipt PDF for Spain residents only (IRPF or Impuesto de Sociedades for company)
        $memberCountry = $member['country'] ?? '';
        $isSpain = $emailAutomation->isSpainResident($memberCountry);
        if ($amount >= 20 && $isSpain) {
            $memberForTax = array_merge($member, ['payment_amount' => $amount, 'membership_type' => $membershipType]);
            $companyOverride = null;
            if (($metadata['tax_fiscal_recipient'] ?? '') === 'company' && !empty($metadata['company_name']) && !empty($metadata['company_cif'])) {
                $companyOverride = [
                    'company_name' => $metadata['company_name'],
                    'company_cif' => $metadata['company_cif'],
                    'company_address' => $metadata['company_address'] ?? null,
                ];
            }
            $variables = $emailAutomation->preparePaymentTaxVariables($memberForTax, $companyOverride);
            $sent = $emailAutomation->sendTaxReceiptPdf($memberId, $variables);
            if (!$sent) {
                error_log("Tax receipt send failed for member_id=$memberId, email={$member['email']}");
            }
        } else {
            error_log("Tax receipt skipped: member_id=$memberId, country=" . ($memberCountry ?: 'empty') . ", isSpain=" . ($isSpain ? 'yes' : 'no') . ", amount=$amount");
        }
        
        // Process email queue
        $emailAutomation->processQueue(10);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Payment confirmed successfully',
        'membership_type' => $membershipType,
        'amount' => $amount,
        'membership_start_date' => $membershipStartDate,
        'membership_end_date' => $membershipEndDate
    ]);
    
} catch (Exception $e) {
    error_log("Confirm payment error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

