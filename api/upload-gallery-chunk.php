<?php
/**
 * Chunked gallery upload — bypasses OVH/nginx ~128MB single-request body limit.
 * Used for large videos from the admin event gallery uploader.
 */
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

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

session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
ob_end_clean();

// Used by both the Gallery tab and the Events tab (event galleries)
requireAnyAdminSection(['gallery', 'events']);
// Release the session lock so long uploads don't block this admin's other requests
session_write_close();

@set_time_limit(300);

define('GALLERY_CHUNK_MAX_BYTES', 12 * 1024 * 1024); // per chunk (must stay under OVH proxy ~128MB)
define('GALLERY_CHUNK_MAX_PARTS', 80); // ~640MB max assembled

function ensureGalleryVideoColumnsChunk(PDO $pdo) {
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;
    try {
        $col = $pdo->query("SHOW COLUMNS FROM gallery_images LIKE 'media_type'");
        if ($col && $col->rowCount() === 0) {
            $pdo->exec("ALTER TABLE gallery_images ADD COLUMN media_type ENUM('image', 'video') DEFAULT 'image' AFTER category");
        }
        $col2 = $pdo->query("SHOW COLUMNS FROM gallery_images LIKE 'video_duration'");
        if ($col2 && $col2->rowCount() === 0) {
            $pdo->exec("ALTER TABLE gallery_images ADD COLUMN video_duration INT NULL AFTER file_size");
        }
    } catch (PDOException $e) {
        error_log('upload-gallery-chunk ensure columns: ' . $e->getMessage());
    }
}

function cleanupChunkSession($tmpDir, $uploadId) {
    foreach (glob($tmpDir . $uploadId . '_*') ?: [] as $path) {
        @unlink($path);
    }
    @unlink($tmpDir . $uploadId . '.meta.json');
}

try {
    ensureGalleryVideoColumnsChunk($pdo);

    $uploadId = trim($_POST['upload_id'] ?? '');
    $chunkIndex = isset($_POST['chunk_index']) ? (int) $_POST['chunk_index'] : -1;
    $totalChunks = isset($_POST['total_chunks']) ? (int) $_POST['total_chunks'] : 0;
    $originalFilename = trim($_POST['original_filename'] ?? '');
    $galleryId = isset($_POST['gallery_id']) ? (int) $_POST['gallery_id'] : null;
    $category = trim($_POST['category'] ?? 'other') ?: 'other';
    $description = trim($_POST['description'] ?? '');

    if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $uploadId)) {
        throw new Exception('Invalid upload session id');
    }
    if ($totalChunks < 1 || $totalChunks > GALLERY_CHUNK_MAX_PARTS) {
        throw new Exception('Invalid chunk count');
    }
    if ($chunkIndex < 0 || $chunkIndex >= $totalChunks) {
        throw new Exception('Invalid chunk index');
    }
    if ($originalFilename === '') {
        throw new Exception('Missing filename');
    }

    $allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'qt'];
    $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedVideoExtensions, true)) {
        throw new Exception('Invalid video type. Use MP4, WebM, MOV, or similar.');
    }

    if (!isset($_FILES['chunk']) || $_FILES['chunk']['error'] !== UPLOAD_ERR_OK) {
        $code = $_FILES['chunk']['error'] ?? UPLOAD_ERR_NO_FILE;
        throw new Exception($code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE
            ? 'Chunk exceeds server upload limit'
            : 'Chunk upload failed');
    }
    if ((int) $_FILES['chunk']['size'] > GALLERY_CHUNK_MAX_BYTES) {
        throw new Exception('Chunk too large');
    }

    if ($galleryId !== null && $galleryId > 0) {
        $g = $pdo->prepare('SELECT id FROM galleries WHERE id = ?');
        $g->execute([$galleryId]);
        if (!$g->fetch()) {
            throw new Exception('Gallery not found');
        }
    }

    $uploadDir = getUploadDirectory('gallery-images/');
    $tmpDir = getUploadDirectory('gallery-images/chunks/');

    $metaPath = $tmpDir . $uploadId . '.meta.json';
    if ($chunkIndex === 0) {
        file_put_contents($metaPath, json_encode([
            'original_filename' => $originalFilename,
            'gallery_id' => $galleryId,
            'category' => $category,
            'description' => $description,
            'total_chunks' => $totalChunks,
            'started_at' => time(),
        ]));
    } elseif (!is_file($metaPath)) {
        throw new Exception('Upload session expired or missing. Please retry.');
    }

    $partPath = $tmpDir . $uploadId . '_' . $chunkIndex;
    if (!move_uploaded_file($_FILES['chunk']['tmp_name'], $partPath)) {
        throw new Exception('Failed to store chunk');
    }

    if ($chunkIndex + 1 < $totalChunks) {
        echo json_encode([
            'success' => true,
            'complete' => false,
            'chunk_index' => $chunkIndex,
            'total_chunks' => $totalChunks,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Last chunk — verify all parts present and assemble
    for ($i = 0; $i < $totalChunks; $i++) {
        if (!is_file($tmpDir . $uploadId . '_' . $i)) {
            throw new Exception("Missing chunk {$i}. Please retry the upload.");
        }
    }

    $meta = json_decode((string) file_get_contents($metaPath), true) ?: [];
    $originalFilename = $meta['original_filename'] ?? $originalFilename;
    $galleryId = isset($meta['gallery_id']) ? (int) $meta['gallery_id'] : $galleryId;
    $category = $meta['category'] ?? $category;
    $description = $meta['description'] ?? $description;
    $extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));

    $uniqueFilename = uniqid() . '_' . time() . '.' . $extension;
    $finalPath = $uploadDir . $uniqueFilename;
    $out = fopen($finalPath, 'wb');
    if (!$out) {
        throw new Exception('Could not create output file');
    }

    $totalSize = 0;
    $maxBytes = getGalleryVideoMaxBytes();
    for ($i = 0; $i < $totalChunks; $i++) {
        $part = $tmpDir . $uploadId . '_' . $i;
        $in = fopen($part, 'rb');
        if (!$in) {
            fclose($out);
            @unlink($finalPath);
            cleanupChunkSession($tmpDir, $uploadId);
            throw new Exception('Failed to read chunk during assembly');
        }
        $copied = stream_copy_to_stream($in, $out);
        fclose($in);
        if ($copied === false) {
            fclose($out);
            @unlink($finalPath);
            cleanupChunkSession($tmpDir, $uploadId);
            throw new Exception('Failed to assemble file');
        }
        $totalSize += $copied;
        if ($totalSize > $maxBytes) {
            fclose($out);
            @unlink($finalPath);
            cleanupChunkSession($tmpDir, $uploadId);
            throw new Exception('Assembled file exceeds maximum allowed size');
        }
    }
    fclose($out);
    cleanupChunkSession($tmpDir, $uploadId);

    $relativeFilePath = 'public/gallery-images/' . $uniqueFilename;
    $altText = $description ?: "Gallery video - {$category}";

    $stmt = $pdo->prepare("
        INSERT INTO gallery_images
        (gallery_id, filename, filepath, thumbnail_filepath, alt_text, description, category, media_type, width, height, file_size, video_duration, uploaded_at)
        VALUES (?, ?, ?, NULL, ?, ?, ?, 'video', 0, 0, ?, NULL, NOW())
    ");
    $stmt->execute([
        $galleryId ?: null,
        $originalFilename,
        $relativeFilePath,
        $altText,
        $description,
        $category,
        $totalSize,
    ]);

    echo json_encode([
        'success' => true,
        'complete' => true,
        'uploaded_count' => 1,
        'message' => 'Video uploaded successfully',
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('upload-gallery-chunk DB: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
