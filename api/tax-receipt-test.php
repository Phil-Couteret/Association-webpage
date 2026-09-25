<?php
/**
 * Test tax receipt send for a member (admin only)
 * Usage: POST with member_id and test_email, or GET ?member_id=X&test_email=Y
 * Sends tax receipt to test_email (or member's email if not provided)
 */
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Credentials: true');

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Admin login required']);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/tax-features.php';
if (!tax_receipt_actions_enabled()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Tax receipt actions are disabled']);
    exit;
}
require_once __DIR__ . '/classes/EmailAutomation.php';

$memberId = isset($_POST['member_id']) ? (int)$_POST['member_id'] : (int)($_GET['member_id'] ?? 0);
$testEmail = $_POST['test_email'] ?? $_GET['test_email'] ?? null;

if ($memberId <= 0) {
    echo json_encode(['success' => false, 'error' => 'member_id required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
    $stmt->execute([$memberId]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$member) {
        echo json_encode(['success' => false, 'error' => 'Member not found']);
        exit;
    }
    
    $emailAutomation = new EmailAutomation($pdo);
    $isSpain = $emailAutomation->isSpainResident($member['country'] ?? '');
    $amount = floatval($member['payment_amount'] ?? 0);
    
    $log = [
        'member_id' => $memberId,
        'email' => $member['email'],
        'country' => $member['country'] ?? '(empty)',
        'is_spain' => $isSpain,
        'payment_amount' => $amount,
        'amount_ok' => $amount >= 20,
    ];
    
    if (!$isSpain || $amount < 20) {
        $log['skipped_reason'] = !$isSpain ? 'Country not Spain' : 'Amount < 20';
        echo json_encode(['success' => false, 'log' => $log]);
        exit;
    }
    
    $memberForTax = array_merge($member, ['payment_amount' => $amount ?: 50, 'membership_type' => $member['membership_type'] ?? 'sponsor']);
    $variables = $emailAutomation->preparePaymentTaxVariables($memberForTax);
    
    $sendTo = $testEmail ?: $member['email'];
    
    // Call sendTaxReceiptPdf - but it sends to member's email. We need to override for testing.
    // Instead, manually do the flow and send to testEmail if provided
    $variables['payment_method'] = $member['payment_method'] ?? 'stripe';
    require_once __DIR__ . '/classes/TaxReceiptPdf.php';
    $pdf = new TaxReceiptPdf($variables);
    $pdfContent = $pdf->generate();
    $receiptId = $variables['receipt_id'] ?? 'EA-' . date('Y') . '-' . str_pad($memberId, 6, '0', STR_PAD_LEFT);
    
    require_once __DIR__ . '/classes/Mailer.php';
    
    // Store for download
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    $pdo->prepare("INSERT INTO tax_receipt_downloads (token, member_id, pdf_content, receipt_id, expires_at) VALUES (?, ?, ?, ?, ?)")
        ->execute([$token, $memberId, $pdfContent, $receiptId, $expiresAt]);
    $downloadUrl = 'https://www.elektr-ame.com/api/download-tax-receipt.php?token=' . $token;
    
    $subject = 'Tu certificado de deducción fiscal - Elektr-Âme';
    $body = "Estimado/a " . ($variables['first_name'] ?? '') . ",\n\nSu certificado oficial de deducción fiscal por su donación a Elektr-Âme está listo.\n\nDescargue su PDF aquí (enlace válido 30 días):\n$downloadUrl\n\nPuede utilizar este PDF al presentar su declaración de IRPF ante la Agencia Tributaria.\n\nSaludos,\nEl equipo de Elektr-Âme";
    $recipientName = $member['first_name'] . ' ' . ($member['last_name'] ?? $member['second_name'] ?? '');
    
    $result = Mailer::send($sendTo, $subject, $body, ['toName' => $recipientName]);
    
    $smtpConfigured = Mailer::isSmtpConfigured();
    $log['sent_to'] = $sendTo;
    $log['mailer_result'] = $result;
    $log['smtp_configured'] = $smtpConfigured;
    
    if ($result) {
        $msg = "Tax receipt sent to $sendTo";
        if (!$smtpConfigured) {
            $msg .= ". WARNING: SMTP not configured - using PHP mail() which often fails on OVH. Upload smtp-config.php via FTP.";
        }
        echo json_encode(['success' => true, 'message' => $msg, 'log' => $log]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Mailer::send returned false', 'log' => $log]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
