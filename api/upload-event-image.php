<?php
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

session_start();
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';

try {
    $eventId = isset($_POST['event_id']) ? (int)$_POST['event_id'] : 0;
    
    if ($eventId <= 0) {
        throw new Exception('Event ID is required');
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No image file uploaded or upload error');
    }

    $file = $_FILES['image'];
    $filename = $file['name'];
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed');
    }

    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception('File too large. Maximum size is 5MB');
    }

    // Use config helper for environment-aware paths
    $uploadDir = getUploadDirectory('event-images/');
    
    // Generate unique filename
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    $uniqueFilename = 'event_' . $eventId . '_' . uniqid() . '_' . time() . '.' . $extension;
    $filePath = $uploadDir . $uniqueFilename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to save image file');
    }

    // Relative path for database (include public/ for HTTP access)
    $relativePath = 'public/event-images/' . $uniqueFilename;

    // Update event with picture path
    $stmt = $pdo->prepare("UPDATE events SET picture = ? WHERE id = ?");
    $stmt->execute([$relativePath, $eventId]);

    echo json_encode([
        'success' => true,
        'message' => 'Event image uploaded successfully',
        'picture' => '/' . $relativePath
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

