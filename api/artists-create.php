<?php
session_start();

header('Content-Type: application/json');
// Allow both production and local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('artists');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (empty($input['name'])) {
        throw new Exception('Name is required');
    }
    if (empty($input['bio'])) {
        throw new Exception('Bio is required');
    }

    // Validate social links (at least one should be provided)
    $socialLinks = $input['socialLinks'] ?? [];
    $hasAnySocialLink = false;
    foreach ($socialLinks as $link) {
        if (!empty($link) && $link !== '#') {
            $hasAnySocialLink = true;
            break;
        }
    }
    
    if (!$hasAnySocialLink) {
        throw new Exception('At least one social media link is required');
    }

    // Convert socialLinks to JSON
    $socialMediaJson = json_encode($socialLinks);

    $bioTranslationsJson = json_encode($input['bioTranslations'] ?? ['en' => '', 'es' => '', 'ca' => '']);
    
    $stmt = $pdo->prepare("
        INSERT INTO artists (name, nickname, bio, bio_key, bio_translations, picture, press_kit_url, song1_url, song2_url, song3_url, stream1_url, stream2_url, stream3_url, genre, website, social_media, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['name'],
        $input['nickname'] ?? '',
        $input['bio'],
        $input['bioKey'] ?? $input['bio_key'] ?? '',
        $bioTranslationsJson,
        $input['picture'] ?? '',
        ($input['pressKitUrl'] ?? $input['press_kit_url'] ?? '') === '' ? null : trim($input['pressKitUrl'] ?? $input['press_kit_url'] ?? ''),
        ($input['song1Url'] ?? $input['song1_url'] ?? '') === '' ? null : trim($input['song1Url'] ?? $input['song1_url'] ?? ''),
        ($input['song2Url'] ?? $input['song2_url'] ?? '') === '' ? null : trim($input['song2Url'] ?? $input['song2_url'] ?? ''),
        ($input['song3Url'] ?? $input['song3_url'] ?? '') === '' ? null : trim($input['song3Url'] ?? $input['song3_url'] ?? ''),
        ($input['stream1Url'] ?? $input['stream1_url'] ?? '') === '' ? null : trim($input['stream1Url'] ?? $input['stream1_url'] ?? ''),
        ($input['stream2Url'] ?? $input['stream2_url'] ?? '') === '' ? null : trim($input['stream2Url'] ?? $input['stream2_url'] ?? ''),
        ($input['stream3Url'] ?? $input['stream3_url'] ?? '') === '' ? null : trim($input['stream3Url'] ?? $input['stream3_url'] ?? ''),
        $input['genre'] ?? null,
        $input['website'] ?? null,
        $socialMediaJson,
        $input['status'] ?? 'active'
    ]);

    $artistId = $pdo->lastInsertId();

    // Fetch the created artist
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
        'message' => 'Artist created successfully',
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

