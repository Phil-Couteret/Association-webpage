<?php
// Prevent any output before headers
ob_start();

header('Content-Type: application/json');
// Prevent caching of API responses
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';

// Clear any output buffer
ob_end_clean();

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $galleryId = (int)($data['id'] ?? $_POST['id'] ?? 0);
    
    if ($galleryId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid gallery ID']);
        exit();
    }
    
    // Check if gallery has images
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM gallery_images WHERE gallery_id = ?");
    $stmt->execute([$galleryId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] > 0) {
        // Set images to NULL gallery_id instead of deleting
        $stmt = $pdo->prepare("UPDATE gallery_images SET gallery_id = NULL WHERE gallery_id = ?");
        $stmt->execute([$galleryId]);
    }
    
    // Soft delete (set is_active = 0) or hard delete
    // Using soft delete to preserve data
    $stmt = $pdo->prepare("UPDATE galleries SET is_active = 0 WHERE id = ?");
    $stmt->execute([$galleryId]);
    
    // Or hard delete:
    // $stmt = $pdo->prepare("DELETE FROM galleries WHERE id = ?");
    // $stmt->execute([$galleryId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Gallery deleted successfully'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in galleries-delete: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in galleries-delete: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

