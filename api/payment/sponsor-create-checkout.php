<?php
/**
 * Create Stripe checkout for company sponsor donation (no member account)
 */
ob_start();
session_start();

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../cors-headers.php';
require_once __DIR__ . '/../classes/StripePayment.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
ob_clean();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }

    $companyName = trim($data['company_name'] ?? '');
    $companyCif = trim($data['company_cif'] ?? '');
    $companyAddress = isset($data['company_address']) ? trim($data['company_address']) : null;
    $contactEmail = trim($data['contact_email'] ?? '');
    $amount = isset($data['amount']) ? floatval($data['amount']) : null;
    $message = isset($data['message']) ? trim($data['message']) : null;
    $logoUrl = isset($data['logo_url']) ? trim($data['logo_url']) : null;

    if (empty($companyName) || empty($companyCif) || empty($contactEmail)) {
        throw new Exception('Company name, CIF, and contact email are required');
    }
    if (!filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid contact email format');
    }
    if ($amount === null || $amount < 20) {
        throw new Exception('Minimum donation amount is €20');
    }

    // Insert sponsor donation record
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'sponsor_donations'");
    if ($tableCheck->rowCount() === 0) {
        throw new Exception('Sponsor donations not configured. Please run database migration.');
    }

    // Check if logo_url column exists
    $hasLogoCol = false;
    $colCheck = $pdo->query("SHOW COLUMNS FROM sponsor_donations LIKE 'logo_url'");
    if ($colCheck && $colCheck->rowCount() > 0) {
        $hasLogoCol = true;
    }

    $logoCol = $hasLogoCol ? ', logo_url' : '';
    $logoVal = $hasLogoCol ? ', ?' : '';
    $stmt = $pdo->prepare("
        INSERT INTO sponsor_donations (company_name, company_cif, company_address, contact_email, amount, currency, status, message $logoCol)
        VALUES (?, ?, ?, ?, ?, 'EUR', 'pending', ? $logoVal)
    ");
    $params = [$companyName, $companyCif, $companyAddress, $contactEmail, $amount, $message];
    if ($hasLogoCol) {
        $params[] = $logoUrl;
    }
    $stmt->execute($params);
    $sponsorId = (int) $pdo->lastInsertId();

    // Create Stripe checkout for sponsor (no member)
    $stripe = new StripePayment($pdo);
    $checkout = $stripe->createSponsorCheckoutSession($sponsorId, $companyName, $companyCif, $companyAddress, $contactEmail, $amount);

    echo json_encode([
        'success' => true,
        'checkout_url' => $checkout['url'],
        'session_id' => $checkout['session_id'],
        'amount' => $amount,
    ]);
} catch (Exception $e) {
    error_log("Sponsor checkout error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
