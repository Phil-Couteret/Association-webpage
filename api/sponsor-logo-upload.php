<?php
/**
 * Upload company logo for sponsor donation (public, no auth)
 * Logo will appear in association communications as a sponsor
 */
ob_start();

header('Content-Type: application/json');
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
    exit();
}

$file = $_FILES['logo'];
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPEG, PNG, and WebP allowed.']);
    exit();
}

$maxSize = 2 * 1024 * 1024; // 2MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size exceeds 2MB limit.']);
    exit();
}

try {
    $uploadDir = getUploadDirectory('sponsor-logos/');
    $filename = 'sponsor_' . time() . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
    $filepath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to save file');
    }

    $relativePath = 'public/sponsor-logos/' . $filename;
    $url = '/' . $relativePath;

    echo json_encode([
        'success' => true,
        'url' => $url,
        'filepath' => $relativePath,
    ]);
} catch (Exception $e) {
    error_log("Sponsor logo upload error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Upload failed']);
}
