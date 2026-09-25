<?php
session_start();
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {

    // Get export type from query parameter
    $exportType = $_GET['type'] ?? 'active'; // 'active', 'all', 'unsubscribed'

    $sql = "SELECT email, subscribed_at, ip_address, unsubscribed_at FROM newsletter_subscribers";
    
    if ($exportType === 'active') {
        $sql .= " WHERE unsubscribed_at IS NULL";
    } elseif ($exportType === 'unsubscribed') {
        $sql .= " WHERE unsubscribed_at IS NOT NULL";
    }
    
    $sql .= " ORDER BY subscribed_at DESC";

    $stmt = $pdo->query($sql);
    $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Set headers for CSV download
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="newsletter_subscribers_' . date('Y-m-d') . '.csv"');

    // Create output stream
    $output = fopen('php://output', 'w');

    // Add BOM for Excel UTF-8 support
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Add header row
    fputcsv($output, ['Email', 'Subscribed At', 'IP Address', 'Unsubscribed At']);

    // Add data rows
    foreach ($subscribers as $subscriber) {
        fputcsv($output, [
            $subscriber['email'],
            $subscriber['subscribed_at'],
            $subscriber['ip_address'] ?? '',
            $subscriber['unsubscribed_at'] ?? ''
        ]);
    }

    fclose($output);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>

