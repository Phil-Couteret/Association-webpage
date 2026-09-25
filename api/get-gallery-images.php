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

require_once __DIR__ . '/config.php';

// Clear any output buffer
ob_end_clean();

try {
    $search = $_GET['search'] ?? '';
    $category = $_GET['category'] ?? 'all';
    $galleryId = isset($_GET['gallery_id']) ? (int)$_GET['gallery_id'] : null;
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);

    $sql = "SELECT * FROM gallery_images WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (filename LIKE ? OR description LIKE ? OR alt_text LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    if ($category !== 'all') {
        $sql .= " AND category = ?";
        $params[] = $category;
    }
    
    if ($galleryId !== null) {
        $sql .= " AND gallery_id = ?";
        $params[] = $galleryId;
    }

    $sql .= " ORDER BY uploaded_at DESC";

    if ($limit > 0) {
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countSql = "SELECT COUNT(*) as total FROM gallery_images WHERE 1=1";
    $countParams = [];

    if (!empty($search)) {
        $countSql .= " AND (filename LIKE ? OR description LIKE ? OR alt_text LIKE ?)";
        $searchTerm = "%{$search}%";
        $countParams[] = $searchTerm;
        $countParams[] = $searchTerm;
        $countParams[] = $searchTerm;
    }

    if ($category !== 'all') {
        $countSql .= " AND category = ?";
        $countParams[] = $category;
    }
    
    if ($galleryId !== null) {
        $countSql .= " AND gallery_id = ?";
        $countParams[] = $galleryId;
    }

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    $imagesByCategory = [];
    foreach ($images as $image) {
        $cat = $image['category'];
        if (!isset($imagesByCategory[$cat])) {
            $imagesByCategory[$cat] = [];
        }
        $imagesByCategory[$cat][] = $image;
    }

    $categoryLabels = [
        'events' => 'Events',
        'artists' => 'Artists',
        'venue' => 'Venue',
        'community' => 'Community',
        'other' => 'Other'
    ];

    echo json_encode([
        'success' => true,
        'data' => [
            'images' => $images,
            'images_by_category' => $imagesByCategory,
            'total_count' => (int)$totalCount,
            'category_labels' => $categoryLabels,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $totalCount
            ]
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in get-gallery-images: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in get-gallery-images: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>