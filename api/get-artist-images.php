<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';

try {
    $artistId = $_GET['artist_id'] ?? null;
    $category = $_GET['category'] ?? null;
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);

    if (!$artistId) {
        throw new Exception('Artist ID is required');
    }

    $sql = "SELECT * FROM artist_images WHERE artist_id = ?";
    $params = [$artistId];

    if ($category) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY is_profile_picture DESC, uploaded_at DESC";

    if ($limit > 0) {
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $countSql = "SELECT COUNT(*) as total FROM artist_images WHERE artist_id = ?";
    $countParams = [$artistId];

    if ($category) {
        $countSql .= " AND category = ?";
        $countParams[] = $category;
    }

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    $profileStmt = $pdo->prepare("
        SELECT * FROM artist_images 
        WHERE artist_id = ? AND is_profile_picture = TRUE 
        LIMIT 1
    ");
    $profileStmt->execute([$artistId]);
    $profilePicture = $profileStmt->fetch(PDO::FETCH_ASSOC);

    $imagesByCategory = [];
    foreach ($images as $image) {
        $cat = $image['category'];
        if (!isset($imagesByCategory[$cat])) {
            $imagesByCategory[$cat] = [];
        }
        $imagesByCategory[$cat][] = $image;
    }

    $categoryLabels = [
        'profile' => 'Profile Picture',
        'stage' => 'On Stage',
        'studio' => 'In Studio',
        'fans' => 'With Fans',
        'behind_scenes' => 'Behind the Scenes',
        'other' => 'Other'
    ];

    echo json_encode([
        'success' => true,
        'data' => [
            'images' => $images,
            'images_by_category' => $imagesByCategory,
            'profile_picture' => $profilePicture,
            'total_count' => (int)$totalCount,
            'category_labels' => $categoryLabels,
            'pagination' => [
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $totalCount
            ]
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>