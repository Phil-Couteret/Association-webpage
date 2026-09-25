<?php
/**
 * Get Event Galleries API
 * Returns all galleries for a specific event
 */

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

require_once __DIR__ . '/config.php';

// Clear any output buffer
ob_end_clean();

try {
    $eventId = isset($_GET['event_id']) ? (int)$_GET['event_id'] : null;
    
    if (!$eventId) {
        throw new Exception('Event ID is required');
    }
    
    // Check if event_id column exists
    $checkCol = $pdo->query("SHOW COLUMNS FROM galleries LIKE 'event_id'");
    $hasEventCol = $checkCol->rowCount() > 0;
    
    if (!$hasEventCol) {
        // If column doesn't exist yet, return empty array
        echo json_encode([
            'success' => true,
            'galleries' => [],
            'message' => 'Event galleries not yet supported (database migration needed)'
        ]);
        exit();
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            g.*,
            COUNT(gi.id) as image_count,
            gi_cover.filepath as cover_image_path
        FROM galleries g
        LEFT JOIN gallery_images gi ON g.id = gi.gallery_id
        LEFT JOIN gallery_images gi_cover ON g.cover_image_id = gi_cover.id
        WHERE g.event_id = ? AND g.is_active = 1
        GROUP BY g.id
        ORDER BY g.display_order ASC, g.created_at DESC
    ");
    
    $stmt->execute([$eventId]);
    $galleries = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Use first image as fallback if no cover image
    foreach ($galleries as &$gallery) {
        if (empty($gallery['cover_image_path']) && $gallery['image_count'] > 0) {
            $firstImageStmt = $pdo->prepare("
                SELECT filepath 
                FROM gallery_images 
                WHERE gallery_id = ? 
                ORDER BY uploaded_at ASC 
                LIMIT 1
            ");
            $firstImageStmt->execute([$gallery['id']]);
            $firstImage = $firstImageStmt->fetch(PDO::FETCH_ASSOC);
            if ($firstImage) {
                $gallery['cover_image_path'] = $firstImage['filepath'];
            }
        }
    }
    unset($gallery);
    
    echo json_encode([
        'success' => true,
        'galleries' => $galleries
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in get-event-galleries: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in get-event-galleries: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

