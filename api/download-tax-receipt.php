<?php
/**
 * Download tax receipt PDF by secure token
 * No auth required - token is single-use and expires
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config-helper.php';

$token = $_GET['token'] ?? '';
if (empty($token) || strlen($token) !== 64) {
    http_response_code(400);
    header('Content-Type: text/plain');
    echo 'Invalid or missing download link.';
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT pdf_content, receipt_id, expires_at 
        FROM tax_receipt_downloads 
        WHERE token = :token
    ");
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        header('Content-Type: text/plain');
        echo 'This download link is invalid or has expired.';
        exit;
    }

    if (strtotime($row['expires_at']) < time()) {
        // Delete expired record
        $pdo->prepare("DELETE FROM tax_receipt_downloads WHERE token = :token")->execute([':token' => $token]);
        http_response_code(410);
        header('Content-Type: text/plain');
        echo 'This download link has expired. Please contact us for a new certificate.';
        exit;
    }

    $pdfContent = $row['pdf_content'];
    if (empty($pdfContent) || substr($pdfContent, 0, 4) !== '%PDF') {
        http_response_code(500);
        header('Content-Type: text/plain');
        echo 'Certificate could not be generated.';
        exit;
    }

    // Delete after successful retrieval (one-time download)
    $pdo->prepare("DELETE FROM tax_receipt_downloads WHERE token = :token")->execute([':token' => $token]);

    $filename = 'ElektrAme-certificado-fiscal-' . $row['receipt_id'] . '.pdf';
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($pdfContent));
    header('Cache-Control: no-store, no-cache, must-revalidate');
    echo $pdfContent;
    exit;

} catch (Exception $e) {
    error_log("Tax receipt download error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: text/plain');
    echo 'An error occurred. Please try again or contact us.';
    exit;
}
