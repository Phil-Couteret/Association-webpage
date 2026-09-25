<?php
/**
 * Create an artists row from an Open Call submission and link it (promoted_artist_id).
 * Requires both open_call and artists admin permissions.
 */
session_start();

header('Content-Type: application/json; charset=utf-8');
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config-helper.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSections(['open_call', 'artists']);

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['id'])) {
        throw new Exception('Submission id is required');
    }

    $id = (int)$input['id'];
    $stmt = $pdo->prepare('
        SELECT id, email, first_name, last_name, dj_name, musical_style,
               mix_link, mix_file_path, photo_path, promoted_artist_id
        FROM open_call_submissions
        WHERE id = ?
    ');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        throw new Exception('Submission not found');
    }

    $existingPromoted = isset($row['promoted_artist_id']) ? (int)$row['promoted_artist_id'] : 0;
    if ($existingPromoted > 0) {
        $chk = $pdo->prepare('SELECT id FROM artists WHERE id = ?');
        $chk->execute([$existingPromoted]);
        if ($chk->fetch()) {
            echo json_encode([
                'success' => true,
                'alreadyLinked' => true,
                'artistId' => $existingPromoted,
                'message' => 'Already linked to an artist',
            ]);
            exit;
        }
        $pdo->prepare('UPDATE open_call_submissions SET promoted_artist_id = NULL WHERE id = ?')->execute([$id]);
    }

    $name = trim((string)($row['dj_name'] ?? ''));
    if ($name === '') {
        $name = 'Artist';
    }

    $nickname = trim(trim((string)($row['first_name'] ?? '')) . ' ' . trim((string)($row['last_name'] ?? '')));

    $bio = trim((string)($row['musical_style'] ?? ''));
    if ($bio === '' || mb_strlen($bio) < 8) {
        $bio = 'Profile imported from Open Call submission.';
    }

    $bioTranslationsJson = json_encode(['en' => '', 'es' => '', 'ca' => '']);

    $picture = trim((string)($row['photo_path'] ?? ''));

    $base = getBaseUrl();
    $social = [];
    $song1 = null;
    $stream1 = null;

    $mixLink = trim((string)($row['mix_link'] ?? ''));
    $mixFile = trim((string)($row['mix_file_path'] ?? ''));

    if ($mixLink !== '' && filter_var($mixLink, FILTER_VALIDATE_URL)) {
        $lower = strtolower($mixLink);
        if (strpos($lower, 'soundcloud.com') !== false) {
            $social['soundcloud'] = $mixLink;
        } elseif (strpos($lower, 'instagram.com') !== false) {
            $social['instagram'] = $mixLink;
        } elseif (strpos($lower, 'spotify.com') !== false) {
            $social['spotify'] = $mixLink;
        } else {
            $social['linktree'] = $mixLink;
        }
    }

    if ($mixFile !== '') {
        $fileUrl = rtrim($base, '/') . '/' . ltrim($mixFile, '/');
        if (empty($social)) {
            $social['linktree'] = $fileUrl;
        }
        $ext = strtolower(pathinfo($mixFile, PATHINFO_EXTENSION));
        $audioExt = ['mp3', 'wav', 'ogg', 'opus', 'm4a', 'aac', 'webm', 'flac'];
        if (in_array($ext, $audioExt, true)) {
            $song1 = $fileUrl;
            $stream1 = $fileUrl;
        }
    }

    if (empty($social)) {
        $social['linktree'] = rtrim($base, '/') . '/';
    }

    $hasAnySocial = false;
    foreach ($social as $v) {
        if (!empty($v) && $v !== '#') {
            $hasAnySocial = true;
            break;
        }
    }
    if (!$hasAnySocial) {
        $social['linktree'] = rtrim($base, '/') . '/';
    }

    $socialMediaJson = json_encode($social);

    $pdo->beginTransaction();

    $ins = $pdo->prepare('
        INSERT INTO artists (name, nickname, bio, bio_key, bio_translations, picture, press_kit_url, song1_url, song2_url, song3_url, stream1_url, stream2_url, stream3_url, genre, website, social_media, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $ins->execute([
        $name,
        $nickname,
        $bio,
        '',
        $bioTranslationsJson,
        $picture,
        null,
        $song1,
        null,
        null,
        $stream1,
        null,
        null,
        null,
        null,
        $socialMediaJson,
        'active',
    ]);

    $artistId = (int)$pdo->lastInsertId();

    $upd = $pdo->prepare('UPDATE open_call_submissions SET promoted_artist_id = ? WHERE id = ?');
    $upd->execute([$artistId, $id]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'artistId' => $artistId,
        'message' => 'Applicant added to artists',
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('open-call-promote-to-artist: ' . $e->getMessage());
    $msg = $e->getMessage();
    if (strpos($msg, 'promoted_artist_id') !== false || strpos($msg, 'Unknown column') !== false) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database is missing column promoted_artist_id. Run database/alter-open-call-promoted-artist-id.sql',
        ]);
        exit;
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
