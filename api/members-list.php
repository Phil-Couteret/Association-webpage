<?php
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

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('members');

try {
    // Check if payment_method column exists (for backward compatibility)
    $hasPaymentMethod = false;
    $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'payment_method'");
    if ($colCheck && $colCheck->rowCount() > 0) {
        $hasPaymentMethod = true;
    }

    // Check if newsletter_subscribe column exists
    $hasNewsletterSubscribe = false;
    $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'newsletter_subscribe'");
    if ($colCheck && $colCheck->rowCount() > 0) {
        $hasNewsletterSubscribe = true;
    }

    // Get all members ordered by creation date (newest first)
    $paymentMethodCol = $hasPaymentMethod ? ', payment_method' : '';
    $newsletterCol = $hasNewsletterSubscribe ? ', newsletter_subscribe' : '';
    $stmt = $pdo->query("
        SELECT 
            id,
            first_name,
            last_name,
            second_name,
            artist_name,
            email,
            phone,
            street,
            zip_code,
            city,
            country,
            status,
            membership_type,
            membership_start_date,
            membership_end_date,
            payment_status,
            last_payment_date,
            payment_amount
            $paymentMethodCol
            $newsletterCol,
            is_dj,
            is_producer,
            is_vj,
            is_visual_artist,
            is_fan,
            notes,
            created_at,
            updated_at
        FROM members
        ORDER BY created_at DESC
    ");
    
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert role fields from integers (0/1) to booleans
    foreach ($members as &$member) {
        $member['is_dj'] = (bool)($member['is_dj'] ?? 0);
        $member['is_producer'] = (bool)($member['is_producer'] ?? 0);
        $member['is_vj'] = (bool)($member['is_vj'] ?? 0);
        $member['is_visual_artist'] = (bool)($member['is_visual_artist'] ?? 0);
        $member['is_fan'] = (bool)($member['is_fan'] ?? 0);
        $member['newsletter_subscribe'] = (bool)($member['newsletter_subscribe'] ?? 0);
    }
    unset($member); // Break reference
    
    echo json_encode([
        'success' => true,
        'members' => $members,
        'total' => count($members)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>

