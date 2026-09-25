<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';

try {
    $status = $_GET['status'] ?? 'all';
    $limit = (int)($_GET['limit'] ?? 100);
    $offset = (int)($_GET['offset'] ?? 0);

    $sql = "SELECT * FROM artists WHERE 1=1";
    $params = [];

    if ($status !== 'all') {
        $sql .= " AND status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY name ASC";

    if ($limit > 0) {
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $artists = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get profile pictures from artist_images table (if it exists)
    $artistIds = array_column($artists, 'id');
    $profilePictures = [];
    
    try {
        if (!empty($artistIds)) {
            $placeholders = implode(',', array_fill(0, count($artistIds), '?'));
            $picStmt = $pdo->prepare("
                SELECT artist_id, filepath 
                FROM artist_images 
                WHERE artist_id IN ($placeholders) AND is_profile_picture = 1
            ");
            $picStmt->execute($artistIds);
            $pics = $picStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($pics as $pic) {
                $profilePictures[$pic['artist_id']] = '/' . $pic['filepath'];
            }
        }
    } catch (PDOException $e) {
        // artist_images table might not exist yet, ignore
    }

    // Format for frontend
    foreach ($artists as &$artist) {
        // Parse JSON social_media field
        $socialMedia = json_decode($artist['social_media'] ?? '{}', true);
        if (!is_array($socialMedia)) {
            $socialMedia = [];
        }
        
        $artist['socialLinks'] = $socialMedia;
        // Use picture from artist_images if available, otherwise use picture column
        $artist['picture'] = $profilePictures[$artist['id']] ?? ($artist['picture'] ?? '');
        $artist['nickname'] = $artist['nickname'] ?? '';
        $artist['bioKey'] = $artist['bio_key'] ?? '';
        
        // Convert snake_case to camelCase - explicitly check and convert
        $pressKitUrl = isset($artist['press_kit_url']) && trim($artist['press_kit_url']) !== '' ? $artist['press_kit_url'] : null;
        $artist['pressKitUrl'] = $pressKitUrl;
        
        $artist['song1Url'] = (isset($artist['song1_url']) && trim($artist['song1_url']) !== '') ? $artist['song1_url'] : null;
        $artist['song2Url'] = (isset($artist['song2_url']) && trim($artist['song2_url']) !== '') ? $artist['song2_url'] : null;
        $artist['song3Url'] = (isset($artist['song3_url']) && trim($artist['song3_url']) !== '') ? $artist['song3_url'] : null;
        $artist['stream1Url'] = (isset($artist['stream1_url']) && trim($artist['stream1_url']) !== '') ? $artist['stream1_url'] : null;
        $artist['stream2Url'] = (isset($artist['stream2_url']) && trim($artist['stream2_url']) !== '') ? $artist['stream2_url'] : null;
        $artist['stream3Url'] = (isset($artist['stream3_url']) && trim($artist['stream3_url']) !== '') ? $artist['stream3_url'] : null;
        
        // Parse bio translations from JSON
        $bioTranslations = json_decode($artist['bio_translations'] ?? '{}', true);
        if (!is_array($bioTranslations)) {
            $bioTranslations = ['en' => '', 'es' => '', 'ca' => ''];
        }
        $artist['bioTranslations'] = $bioTranslations;
        
        $artist['createdAt'] = $artist['created_at'];
        $artist['updatedAt'] = $artist['updated_at'];
        
        // Remove snake_case keys after conversion
        unset($artist['created_at'], $artist['updated_at'], $artist['social_media'], $artist['bio_translations'], 
              $artist['bio_key'], $artist['press_kit_url'], $artist['song1_url'], $artist['song2_url'], 
              $artist['song3_url'], $artist['stream1_url'], $artist['stream2_url'], $artist['stream3_url']);
    }
    unset($artist); // Break the reference

    echo json_encode([
        'success' => true,
        'artists' => $artists,
        'count' => count($artists)
    ]);

} catch (PDOException $e) {
    error_log("Database error in artists-list: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage(),
        'artists' => []
    ]);
    exit();
} catch (Exception $e) {
    error_log("Error in artists-list: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'artists' => []
    ]);
    exit();
}
?>

