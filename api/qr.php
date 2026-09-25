<?php
/**
 * QR code proxy - fetches from external API and returns PNG.
 * Requires member to be logged in; validates member_id matches session.
 * Use: /api/qr.php?member_id=123
 */
session_start();

header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400'); // Cache 24h

$memberId = isset($_GET['member_id']) ? (int) $_GET['member_id'] : 0;
if ($memberId <= 0) {
    http_response_code(400);
    exit;
}

if (!isset($_SESSION['member_id']) || (int) $_SESSION['member_id'] !== $memberId) {
    http_response_code(403);
    exit;
}

$value = 'EA-' . str_pad((string) $memberId, 6, '0', STR_PAD_LEFT);
$url = 'https://api.qrserver.com/v1/create-qr-code/?' . http_build_query([
    'size' => '256x256',
    'data' => $value,
    'format' => 'png',
]);

$img = @file_get_contents($url);
if ($img === false) {
    http_response_code(502);
    exit;
}

echo $img;
