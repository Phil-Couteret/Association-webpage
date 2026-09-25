<?php
/**
 * Stripe Webhook Handler
 * Processes webhook events from Stripe
 * 
 * IMPORTANT: This endpoint should be publicly accessible (no session check)
 * Security is handled via webhook signature verification
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/StripePayment.php';
require_once __DIR__ . '/../classes/EmailAutomation.php';

header('Content-Type: application/json');

// Get raw POST data
$payload = @file_get_contents('php://input');
$signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if (empty($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty payload']);
    exit;
}

try {
    // Initialize Stripe
    $stripe = new StripePayment($pdo);
    
    // Verify webhook signature
    try {
        $stripe->verifyWebhookSignature($payload, $signature);
    } catch (Exception $e) {
        error_log("Webhook signature verification failed: " . $e->getMessage());
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
    
    // Parse event
    $event = json_decode($payload, true);
    
    if (!$event || !isset($event['type'])) {
        throw new Exception('Invalid event data');
    }
    
    $eventType = $event['type'];
    $eventId = $event['id'];
    
    // Check if event already processed
    $checkStmt = $pdo->prepare("
        SELECT id, processed FROM payment_webhooks 
        WHERE event_id = ?
    ");
    $checkStmt->execute([$eventId]);
    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing && $existing['processed']) {
        // Event already processed, return success
        http_response_code(200);
        echo json_encode(['received' => true, 'message' => 'Event already processed']);
        exit;
    }
    
    // Store webhook event
    if (!$existing) {
        $storeStmt = $pdo->prepare("
            INSERT INTO payment_webhooks (gateway, event_type, event_id, payload)
            VALUES ('stripe', ?, ?, ?)
        ");
        $storeStmt->execute([$eventType, $eventId, $payload]);
    }
    
    // Process event
    $processed = false;
    $errorMessage = null;
    
    try {
        switch ($eventType) {
            case 'checkout.session.completed':
                $processed = handleCheckoutCompleted($pdo, $stripe, $event['data']['object']);
                break;
                
            case 'payment_intent.succeeded':
                $processed = handlePaymentIntentSucceeded($pdo, $stripe, $event['data']['object']);
                break;
                
            case 'payment_intent.payment_failed':
                $processed = handlePaymentIntentFailed($pdo, $stripe, $event['data']['object']);
                break;
                
            case 'charge.refunded':
                $processed = handleChargeRefunded($pdo, $stripe, $event['data']['object']);
                break;

            case 'checkout.session.expired':
                $processed = handleCheckoutExpired($pdo, $stripe, $event['data']['object']);
                break;
                
            default:
                // Unknown event type, log but don't error
                error_log("Unhandled webhook event type: " . $eventType);
                $processed = true; // Mark as processed to avoid reprocessing
        }
    } catch (Exception $e) {
        $errorMessage = $e->getMessage();
        error_log("Webhook processing error: " . $errorMessage);
    }
    
    // Update webhook record
    $updateStmt = $pdo->prepare("
        UPDATE payment_webhooks 
        SET processed = ?, 
            processed_at = CURRENT_TIMESTAMP,
            error_message = ?
        WHERE event_id = ?
    ");
    $updateStmt->execute([$processed ? 1 : 0, $errorMessage, $eventId]);
    
    if ($processed) {
        http_response_code(200);
        echo json_encode(['received' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Processing failed', 'message' => $errorMessage]);
    }
    
} catch (Exception $e) {
    error_log("Webhook error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Handle sponsor donation checkout completed (company, no member)
 */
function handleSponsorCheckoutCompleted($pdo, $session, $sponsorId, $metadata) {
    $amount = $session['amount_total'] / 100;
    $updateStmt = $pdo->prepare("UPDATE sponsor_donations SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $updateStmt->execute([$sponsorId]);
    $stmt = $pdo->prepare("SELECT * FROM sponsor_donations WHERE id = ?");
    $stmt->execute([$sponsorId]);
    $sponsor = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sponsor) return true;
    require_once __DIR__ . '/../classes/EmailAutomation.php';
    require_once __DIR__ . '/../classes/TaxCalculator.php';
    $emailAutomation = new EmailAutomation($pdo);
    $taxCalculator = new TaxCalculator();
    $taxCalc = $taxCalculator->calculate($amount);
    $variables = [
        'full_name' => $metadata['company_name'] ?? $sponsor['company_name'],
        'company_cif' => $metadata['company_cif'] ?? $sponsor['company_cif'],
        'company_address' => $metadata['company_address'] ?? $sponsor['company_address'] ?? '',
        'amount' => $amount,
        'date' => date('F j, Y'),
        'receipt_id' => 'EA-S' . date('Y') . '-' . str_pad($sponsorId, 6, '0', STR_PAD_LEFT),
        'tax_type' => 'company',
    ];
    $variables['tax_deduction'] = number_format($taxCalc['deduction'], 2);
    $variables['net_cost'] = number_format($taxCalc['netCost'], 2);
    $variables['discount_percent'] = number_format($taxCalc['effectiveDiscount'], 1);
    $variables['tax_deduction_first_250'] = number_format(min($amount, 250) * 0.80, 2);
    $variables['tax_deduction_above_250'] = number_format(max(0, $amount - 250) * 0.40, 2);
    $emailAutomation->sendSponsorTaxReceiptPdf($sponsorId, $variables, $sponsor['contact_email']);
    return true;
}

/**
 * Handle checkout.session.completed event
 * Also sends emails (confirmation, tax receipt) - webhook is reliable vs confirm-payment which can fail if session is lost after Stripe redirect
 */
function handleCheckoutCompleted($pdo, $stripe, $session) {
    $sessionId = $session['id'];
    $metadata = $session['metadata'] ?? [];
    $memberId = isset($metadata['member_id']) ? (int)$metadata['member_id'] : null;
    $sponsorId = isset($metadata['sponsor_donation_id']) ? (int)$metadata['sponsor_donation_id'] : null;

    // Sponsor donation (company, no member)
    if ($sponsorId) {
        return handleSponsorCheckoutCompleted($pdo, $session, $sponsorId, $metadata);
    }

    if (!$memberId) {
        throw new Exception('Member ID or Sponsor ID not found in session metadata');
    }
    
    // Update transaction status
    $stripe->updateTransactionStatus(
        $sessionId,
        'completed',
        null,
        json_encode($session)
    );
    
    // Update member - payment results in yearly (basic/sponsor) or lifetime (admin-only type, but can be paid)
    $txMembershipType = $metadata['membership_type'] ?? null;
    $membershipType = ($txMembershipType === 'lifetime') ? 'lifetime' : 'yearly';
    $membershipStartDate = $metadata['membership_start_date'] ?? date('Y-m-d');
    $membershipEndDate = $metadata['membership_end_date'] ?? null;
    $amount = $session['amount_total'] / 100;
    
    $termsVersion = '2026-01';
    $updateStmt = $pdo->prepare("
        UPDATE members SET
            membership_type = ?,
            membership_start_date = ?,
            membership_end_date = ?,
            payment_status = 'paid',
            payment_amount = ?,
            last_payment_date = CURDATE(),
            payment_method = 'stripe',
            terms_accepted_at = COALESCE(terms_accepted_at, NOW()),
            terms_version = COALESCE(terms_version, ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    
    $updateStmt->execute([
        $membershipType,
        $membershipStartDate,
        $membershipEndDate,
        $amount,
        $termsVersion,
        $memberId
    ]);
    
    // Send emails (webhook is reliable - confirm-payment can fail if session lost after Stripe redirect)
    try {
        $memberStmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        if ($member) {
            $emailAutomation = new EmailAutomation($pdo);
            $recipientName = $member['first_name'] . ' ' . ($member['last_name'] ?? $member['second_name'] ?? '');
            $isFirstPayment = empty($member['last_payment_date']) || $member['payment_status'] !== 'paid';
            if ($isFirstPayment) {
                $emailAutomation->queueEmail($member['email'], $recipientName, 'member_welcome', ['first_name' => $member['first_name'], 'membership_type' => ucfirst($membershipType)], $memberId, 'high');
            }
            $emailAutomation->queueEmail($member['email'], $recipientName, 'payment_confirmation', [
                'first_name' => $member['first_name'],
                'amount' => number_format($amount, 2),
                'membership_type' => ucfirst($membershipType),
                'date' => date('Y-m-d'),
            ], $memberId, 'high');
            if ($amount >= 20 && $emailAutomation->isSpainResident($member['country'] ?? '')) {
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
                $emailAutomation->sendTaxReceiptPdf($memberId, $variables);
            }
            $emailAutomation->processQueue(10);
        }
    } catch (Exception $e) {
        error_log("Webhook email send error: " . $e->getMessage());
    }
    
    return true;
}

/**
 * Handle payment_intent.succeeded event
 */
function handlePaymentIntentSucceeded($pdo, $stripe, $paymentIntent) {
    $paymentIntentId = $paymentIntent['id'];
    $metadata = $paymentIntent['metadata'] ?? [];
    $memberId = isset($metadata['member_id']) ? (int)$metadata['member_id'] : null;
    
    if ($memberId) {
        // Update transaction if exists
        $stripe->updateTransactionStatus(
            $paymentIntentId,
            'completed',
            null,
            json_encode($paymentIntent)
        );
    }
    
    return true;
}

/**
 * Handle payment_intent.payment_failed event
 */
function handlePaymentIntentFailed($pdo, $stripe, $paymentIntent) {
    $paymentIntentId = $paymentIntent['id'];
    $errorMessage = $paymentIntent['last_payment_error']['message'] ?? 'Payment failed';
    
    $stripe->updateTransactionStatus(
        $paymentIntentId,
        'failed',
        $errorMessage,
        json_encode($paymentIntent)
    );
    
    return true;
}

/**
 * Handle checkout.session.expired event (user abandoned checkout)
 */
function handleCheckoutExpired($pdo, $stripe, $session) {
    $sessionId = $session['id'];
    $stripe->updateTransactionStatus(
        $sessionId,
        'cancelled',
        'Checkout session expired',
        json_encode($session)
    );
    return true;
}

/**
 * Handle charge.refunded event
 * Charge provides payment_intent (pi_xxx); Checkout Sessions store session_id (cs_xxx).
 * Use updateTransactionStatusByPaymentIntent to find by payment_intent_id column.
 */
function handleChargeRefunded($pdo, $stripe, $charge) {
    $paymentIntentId = $charge['payment_intent'] ?? null;
    
    if ($paymentIntentId) {
        $stripe->updateTransactionStatusByPaymentIntent(
            $paymentIntentId,
            'refunded',
            'Charge refunded',
            json_encode($charge)
        );
    }
    
    return true;
}

