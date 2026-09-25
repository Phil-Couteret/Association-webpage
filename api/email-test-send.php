<?php
/**
 * Send a test email to admin
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Check authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/classes/EmailAutomation.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $templateKey = $input['template_key'] ?? null;
    $testEmail = $input['test_email'] ?? $_SESSION['admin_email'];

    if (!$templateKey) {
        throw new Exception('Template key is required');
    }

    // Get a sample member for testing
    $stmt = $pdo->query("SELECT * FROM members WHERE status = 'approved' ORDER BY id DESC LIMIT 1");
    $sampleMember = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sampleMember) {
        throw new Exception('No members found for testing');
    }

    $emailAutomation = new EmailAutomation($pdo);

    // Queue test email
    $result = $emailAutomation->queueEmail(
        $testEmail,
        'Test Admin',
        $templateKey,
        [
            'first_name' => $sampleMember['first_name'],
            'full_name' => $sampleMember['first_name'] . ' ' . $sampleMember['second_name'],
            'email' => $sampleMember['email'],
            'membership_type' => ucfirst($sampleMember['membership_type']),
            'end_date' => $sampleMember['end_date'] ? date('F j, Y', strtotime($sampleMember['end_date'])) : 'N/A',
            'amount' => '50.00',
            'tax_deduction' => '30.00',
            'net_cost' => '20.00',
            'discount_percent' => '60',
            'date' => date('F j, Y'),
            'receipt_id' => 'EA-TEST-' . time(),
            'tax_deduction_info' => 'Test tax deduction info',
            'tax_receipt_info' => 'Test tax receipt info',
            'recurring_bonus_info' => ''
        ],
        null,
        'high'
    );

    if ($result) {
        // Process queue immediately for test
        $emailAutomation->processQueue(1);

        echo json_encode([
            'success' => true,
            'message' => "Test email sent to $testEmail"
        ]);
    } else {
        throw new Exception('Failed to queue test email');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

