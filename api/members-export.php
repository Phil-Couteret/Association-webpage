<?php
session_start();

header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Credentials: true');

// Check if user is authenticated
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {
    
    // Get all members
    $stmt = $pdo->query("
        SELECT 
            id,
            first_name,
            last_name,
            second_name,
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
            payment_amount,
            notes,
            created_at
        FROM members
        ORDER BY created_at DESC
    ");
    
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Set headers for CSV download
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="elektr-ame-members-' . date('Y-m-d') . '.csv"');
    
    // Create output stream
    $output = fopen('php://output', 'w');
    
    // Add BOM for UTF-8 (helps Excel recognize UTF-8)
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // Add CSV headers
    fputcsv($output, [
        'ID',
        'First Name',
        'Last Name',
        'Second Name',
        'Email',
        'Phone',
        'Street',
        'Zip Code',
        'City',
        'Country',
        'Status',
        'Membership Type',
        'Start Date',
        'End Date',
        'Payment Status',
        'Last Payment',
        'Amount',
        'Notes',
        'Registration Date'
    ]);
    
    // Add member data
    foreach ($members as $member) {
        fputcsv($output, [
            $member['id'],
            $member['first_name'],
            $member['last_name'],
            $member['second_name'],
            $member['email'],
            $member['phone'],
            $member['street'],
            $member['zip_code'],
            $member['city'],
            $member['country'],
            $member['status'],
            $member['membership_type'] ?? '',
            $member['membership_start_date'] ?? '',
            $member['membership_end_date'] ?? '',
            $member['payment_status'] ?? '',
            $member['last_payment_date'] ?? '',
            $member['payment_amount'] ?? '',
            $member['notes'] ?? '',
            $member['created_at']
        ]);
    }
    
    fclose($output);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo 'Database error: ' . $e->getMessage();
}
?>

