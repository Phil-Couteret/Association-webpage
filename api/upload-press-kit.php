<?php
session_start();

header('Content-Type: application/json');
// Allow both production and local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is authenticated
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config-helper.php';

// Create upload directory for press-kits
$uploadDir = getUploadDirectory('press-kits/');

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

try {
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error occurred');
    }

    $file = $_FILES['file'];
    $filename = $file['name'];
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    
    // Allowed file types for press-kits
    $allowedExtensions = ['pdf', 'doc', 'docx'];
    $allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    // Validate file type
    if (!in_array($extension, $allowedExtensions) || !in_array($file['type'], $allowedMimeTypes)) {
        throw new Exception('Invalid file type. Only PDF and DOC/DOCX files are allowed.');
    }

    // Validate file size (max 10MB)
    $maxSize = 10 * 1024 * 1024; // 10MB
    if ($file['size'] > $maxSize) {
        throw new Exception('File too large. Maximum size is 10MB.');
    }

    // Generate unique filename
    $uniqueFilename = uniqid() . '_' . time() . '.' . $extension;
    $filePath = $uploadDir . $uniqueFilename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to save file');
    }

    // Return relative path for database storage
    $relativePath = 'public/press-kits/' . $uniqueFilename;

    echo json_encode([
        'success' => true,
        'message' => 'Press-kit uploaded successfully',
        'filepath' => $relativePath,
        'url' => '/' . $relativePath
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

