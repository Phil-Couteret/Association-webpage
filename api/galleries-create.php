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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    $title = trim($data['title'] ?? '');
    $description = trim($data['description'] ?? '');
    $displayOrder = (int)($data['display_order'] ?? 0);
    $eventId = isset($data['event_id']) ? (int)$data['event_id'] : null;
    $artistId = isset($data['artist_id']) ? (int)$data['artist_id'] : null;
    $galleryType = $data['gallery_type'] ?? 'general';
    
    if (empty($title)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title is required']);
        exit();
    }
    
    // Check if columns exist before using them
    $columns = ['title', 'description', 'display_order', 'is_active'];
    $values = [$title, $description ?: null, $displayOrder, 1];
    
    // Check for event_id column
    $checkEventCol = $pdo->query("SHOW COLUMNS FROM galleries LIKE 'event_id'");
    if ($checkEventCol->rowCount() > 0 && $eventId) {
        $columns[] = 'event_id';
        $values[] = $eventId;
    }
    
    // Check for artist_id column
    $checkArtistCol = $pdo->query("SHOW COLUMNS FROM galleries LIKE 'artist_id'");
    if ($checkArtistCol->rowCount() > 0 && $artistId) {
        $columns[] = 'artist_id';
        $values[] = $artistId;
    }
    
    // Check for gallery_type column
    $checkTypeCol = $pdo->query("SHOW COLUMNS FROM galleries LIKE 'gallery_type'");
    if ($checkTypeCol->rowCount() > 0) {
        $columns[] = 'gallery_type';
        $values[] = $galleryType;
    }
    
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $columnsList = implode(', ', $columns);
    
    $stmt = $pdo->prepare("
        INSERT INTO galleries ({$columnsList})
        VALUES ({$placeholders})
    ");
    
    $stmt->execute($values);
    
    $galleryId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'gallery' => [
            'id' => $galleryId,
            'title' => $title,
            'description' => $description,
            'display_order' => $displayOrder,
            'image_count' => 0
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in galleries-create: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in galleries-create: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

