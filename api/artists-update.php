<?php
session_start();

header('Content-Type: application/json');
// Allow both production and local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
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

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['id'])) {
        throw new Exception('Artist ID is required');
    }

    $artistId = (int)$input['id'];

    // Check if artist exists
    $stmt = $pdo->prepare("SELECT id FROM artists WHERE id = ?");
    $stmt->execute([$artistId]);
    if (!$stmt->fetch()) {
        throw new Exception('Artist not found');
    }

    // Build update query dynamically
    $updateFields = [];
    $params = [];

    if (isset($input['name'])) {
        $updateFields[] = "name = ?";
        $params[] = $input['name'];
    }
    if (isset($input['nickname'])) {
        $updateFields[] = "nickname = ?";
        $params[] = $input['nickname'];
    }
    if (isset($input['bio'])) {
        $updateFields[] = "bio = ?";
        $params[] = $input['bio'];
    }
    if (isset($input['bioKey']) || isset($input['bio_key'])) {
        $updateFields[] = "bio_key = ?";
        $params[] = $input['bioKey'] ?? $input['bio_key'] ?? '';
    }
    if (isset($input['bioTranslations'])) {
        $bioTranslationsJson = json_encode($input['bioTranslations']);
        $updateFields[] = "bio_translations = ?";
        $params[] = $bioTranslationsJson;
    }
    // Only update picture if a non-empty value is provided
    // Profile pictures are managed via artist_images table
    if (isset($input['picture']) && !empty(trim($input['picture']))) {
        $updateFields[] = "picture = ?";
        $params[] = $input['picture'];
    }
    if (isset($input['pressKitUrl']) || isset($input['press_kit_url'])) {
        $value = trim($input['pressKitUrl'] ?? $input['press_kit_url'] ?? '');
        $updateFields[] = "press_kit_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['song1Url']) || isset($input['song1_url'])) {
        $value = trim($input['song1Url'] ?? $input['song1_url'] ?? '');
        $updateFields[] = "song1_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['song2Url']) || isset($input['song2_url'])) {
        $value = trim($input['song2Url'] ?? $input['song2_url'] ?? '');
        $updateFields[] = "song2_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['song3Url']) || isset($input['song3_url'])) {
        $value = trim($input['song3Url'] ?? $input['song3_url'] ?? '');
        $updateFields[] = "song3_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['stream1Url']) || isset($input['stream1_url'])) {
        $value = trim($input['stream1Url'] ?? $input['stream1_url'] ?? '');
        $updateFields[] = "stream1_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['stream2Url']) || isset($input['stream2_url'])) {
        $value = trim($input['stream2Url'] ?? $input['stream2_url'] ?? '');
        $updateFields[] = "stream2_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['stream3Url']) || isset($input['stream3_url'])) {
        $value = trim($input['stream3Url'] ?? $input['stream3_url'] ?? '');
        $updateFields[] = "stream3_url = ?";
        $params[] = $value === '' ? null : $value;
    }
    if (isset($input['genre'])) {
        $updateFields[] = "genre = ?";
        $params[] = $input['genre'];
    }
    if (isset($input['website'])) {
        $updateFields[] = "website = ?";
        $params[] = $input['website'];
    }
    if (isset($input['socialLinks'])) {
        $socialMediaJson = json_encode($input['socialLinks']);
        $updateFields[] = "social_media = ?";
        $params[] = $socialMediaJson;
    }
    if (isset($input['status'])) {
        $updateFields[] = "status = ?";
        $params[] = $input['status'];
    }

    if (empty($updateFields)) {
        throw new Exception('No fields to update');
    }

    $params[] = $artistId;
    $sql = "UPDATE artists SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    } catch (PDOException $e) {
        // Check if error is due to missing column
        if (strpos($e->getMessage(), 'Unknown column') !== false) {
            error_log("Database column missing: " . $e->getMessage());
            throw new Exception('Database column missing. Please run the migration: database/artists-add-press-kit.sql and database/artists-add-songs-streams.sql');
        }
        throw $e;
    }

    // Fetch updated artist
    $stmt = $pdo->prepare("SELECT * FROM artists WHERE id = ?");
    $stmt->execute([$artistId]);
    $artist = $stmt->fetch(PDO::FETCH_ASSOC);

    // Format for frontend
    $socialMedia = json_decode($artist['social_media'] ?? '{}', true);
    if (!is_array($socialMedia)) {
        $socialMedia = [];
    }
    
    $artist['socialLinks'] = $socialMedia;
    $artist['bioKey'] = $artist['bio_key'] ?? '';
    $artist['pressKitUrl'] = $artist['press_kit_url'] ?? null;
    $artist['song1Url'] = $artist['song1_url'] ?? null;
    $artist['song2Url'] = $artist['song2_url'] ?? null;
    $artist['song3Url'] = $artist['song3_url'] ?? null;
    $artist['stream1Url'] = $artist['stream1_url'] ?? null;
    $artist['stream2Url'] = $artist['stream2_url'] ?? null;
    $artist['stream3Url'] = $artist['stream3_url'] ?? null;
    
    // Parse bio translations from JSON
    $bioTranslations = json_decode($artist['bio_translations'] ?? '{}', true);
    if (!is_array($bioTranslations)) {
        $bioTranslations = ['en' => '', 'es' => '', 'ca' => ''];
    }
    $artist['bioTranslations'] = $bioTranslations;
    
    $artist['createdAt'] = $artist['created_at'];
    $artist['updatedAt'] = $artist['updated_at'];
    unset($artist['created_at'], $artist['updated_at'], $artist['social_media'], $artist['bio_key'], $artist['bio_translations'],
          $artist['press_kit_url'], $artist['song1_url'], $artist['song2_url'], $artist['song3_url'],
          $artist['stream1_url'], $artist['stream2_url'], $artist['stream3_url']);

    echo json_encode([
        'success' => true,
        'message' => 'Artist updated successfully',
        'artist' => $artist
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

