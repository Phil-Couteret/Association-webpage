<?php
// Prevent any output before headers
ob_start();

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Use config helper for environment-aware CORS
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';

// Clear any output buffer before processing
ob_end_clean();

// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

$memberId = $_SESSION['member_id'];

// Check if file was uploaded
if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'No file uploaded or upload error'
    ]);
    exit;
}

$file = $_FILES['profile_picture'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

// Check file extension first
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
    ]);
    exit;
}

// Check MIME type if available
if (file_exists($file['tmp_name']) && function_exists('mime_content_type')) {
    $fileType = mime_content_type($file['tmp_name']);
    if ($fileType && !in_array($fileType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        ]);
        exit;
    }
}

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024; // 5MB
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'File size exceeds 5MB limit.'
    ]);
    exit;
}

try {
    // Create upload directory using environment-aware helper
    $uploadDir = getUploadDirectory('member-profiles/');
    
    // Generate unique filename (extension already validated above)
    $filename = 'member_' . $memberId . '_' . time() . '_' . uniqid() . '.' . $extension;
    $filepath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // Get relative path for database (consistent with other uploads)
    $relativePath = 'public/member-profiles/' . $filename;

    // Update member profile picture in database
    $stmt = $pdo->prepare("
        UPDATE members 
        SET profile_picture = ? 
        WHERE id = ?
    ");
    
    $stmt->execute([$relativePath, $memberId]);

    // Delete old profile picture if it exists
    $stmt = $pdo->prepare("SELECT profile_picture FROM members WHERE id = ?");
    $stmt->execute([$memberId]);
    $oldProfile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($oldProfile && $oldProfile['profile_picture']) {
        // Handle both /public/... and public/... paths
        $oldPath = ltrim($oldProfile['profile_picture'], '/');
        $oldFullPath = getUploadDirectory('') . $oldPath;
        
        if (file_exists($oldFullPath)) {
            @unlink($oldFullPath);
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Profile picture uploaded successfully',
        'filepath' => $relativePath,
        'url' => '/' . $relativePath
    ]);

} catch (Exception $e) {
    error_log("Profile picture upload error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to upload profile picture: ' . $e->getMessage()
    ]);
}

