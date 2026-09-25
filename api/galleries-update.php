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

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    $galleryId = (int)($data['id'] ?? 0);
    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : null;
    $coverImageId = isset($data['cover_image_id']) ? (int)$data['cover_image_id'] : null;
    
    if ($galleryId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid gallery ID']);
        exit();
    }
    
    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title is required']);
        exit();
    }
    
    $updates = [];
    $params = [];
    
    if (!empty($title)) {
        $updates[] = "title = ?";
        $params[] = $title;
    }
    
    if (isset($description)) {
        $updates[] = "description = ?";
        $params[] = $description ?: null;
    }
    
    if ($displayOrder !== null) {
        $updates[] = "display_order = ?";
        $params[] = $displayOrder;
    }
    
    if ($coverImageId !== null) {
        $updates[] = "cover_image_id = ?";
        $params[] = $coverImageId ?: null;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit();
    }
    
    $params[] = $galleryId;
    
    $sql = "UPDATE galleries SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Gallery updated successfully'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in galleries-update: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in galleries-update: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

