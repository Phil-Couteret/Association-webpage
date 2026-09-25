<?php
/**
 * Upload Event Video API
 * Allows uploading videos for events (in addition to the main picture)
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

session_start();
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';

// Clear any output buffer before JSON output
ob_end_clean();

try {
    $eventId = isset($_POST['event_id']) ? (int)$_POST['event_id'] : 0;
    
    if ($eventId <= 0) {
        throw new Exception('Event ID is required');
    }

    // Check if event exists
    $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ?");
    $stmt->execute([$eventId]);
    if (!$stmt->fetch()) {
        throw new Exception('Event not found');
    }

    // Check if event_media table exists, if not create it
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'event_media'");
    if ($tableCheck->rowCount() === 0) {
        // Create event_media table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS event_media (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                filepath VARCHAR(500) NOT NULL,
                thumbnail_filepath VARCHAR(500) NULL,
                alt_text VARCHAR(255) NOT NULL,
                description TEXT,
                media_type ENUM('image', 'video') DEFAULT 'image',
                width INT DEFAULT 0,
                height INT DEFAULT 0,
                file_size INT DEFAULT 0,
                video_duration INT NULL,
                display_order INT DEFAULT 0,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_event_id (event_id),
                INDEX idx_media_type (media_type),
                INDEX idx_display_order (display_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    $uploadDir = getUploadDirectory('event-media/');
    $thumbnailDir = getUploadDirectory('event-media/thumbnails/');

    // Handle both single and multiple files
    $files = [];
    if (isset($_FILES['videos']) && is_array($_FILES['videos']['name'])) {
        foreach ($_FILES['videos']['name'] as $index => $filename) {
            if (!empty($filename)) {
                $files[] = [
                    'name' => $_FILES['videos']['name'][$index],
                    'type' => $_FILES['videos']['type'][$index],
                    'tmp_name' => $_FILES['videos']['tmp_name'][$index],
                    'error' => $_FILES['videos']['error'][$index],
                    'size' => $_FILES['videos']['size'][$index]
                ];
            }
        }
    } else if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        $files[] = $_FILES['video'];
    }

    if (empty($files)) {
        throw new Exception('No video file uploaded');
    }

    $uploadedCount = 0;
    $errors = [];

    foreach ($files as $file) {
        // Validate file type
        $allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        if (!in_array($file['type'], $allowedVideoTypes)) {
            $errors[] = "Invalid file type for {$file['name']}";
            continue;
        }

        // Validate file size (max 512MB, subject to server ini)
        $maxVideoBytes = function_exists('getGalleryVideoMaxBytes') ? getGalleryVideoMaxBytes() : (512 * 1024 * 1024);
        if ($file['size'] > $maxVideoBytes) {
            $errors[] = "File too large for {$file['name']} (max: " . round($maxVideoBytes / 1024 / 1024) . "MB)";
            continue;
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $uniqueFilename = 'event_' . $eventId . '_' . uniqid() . '_' . time() . '.' . $extension;
        $filePath = $uploadDir . $uniqueFilename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $errors[] = "Failed to save {$file['name']}";
            continue;
        }

        // Extract video thumbnail and metadata
        $thumbnailPath = $thumbnailDir . 'thumb_' . pathinfo($uniqueFilename, PATHINFO_FILENAME) . '.jpg';
        $videoInfo = getVideoInfo($filePath, $thumbnailPath);
        
        $width = $videoInfo['width'] ?? 0;
        $height = $videoInfo['height'] ?? 0;
        $videoDuration = $videoInfo['duration'] ?? null;
        $relativeThumbnailPath = null;
        
        if (file_exists($thumbnailPath)) {
            $relativeThumbnailPath = 'public/event-media/thumbnails/thumb_' . pathinfo($uniqueFilename, PATHINFO_FILENAME) . '.jpg';
        }

        $relativeFilePath = 'public/event-media/' . $uniqueFilename;
        $description = $_POST['description'] ?? '';
        $altText = $description ?: "Event video - {$file['name']}";

        // Insert into event_media table
        $stmt = $pdo->prepare("
            INSERT INTO event_media 
            (event_id, filename, filepath, thumbnail_filepath, alt_text, description, media_type, width, height, file_size, video_duration, uploaded_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'video', ?, ?, ?, ?, NOW())
        ");

        $stmt->execute([
            $eventId,
            $file['name'],
            $relativeFilePath,
            $relativeThumbnailPath,
            $altText,
            $description,
            $width,
            $height,
            $file['size'],
            $videoDuration
        ]);

        $uploadedCount++;
    }

    if ($uploadedCount > 0) {
        echo json_encode([
            'success' => true,
            'message' => "Successfully uploaded {$uploadedCount} video(s)",
            'uploaded_count' => $uploadedCount,
            'errors' => $errors
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No videos were uploaded',
            'errors' => $errors
        ]);
    }

} catch (PDOException $e) {
    error_log("Database error in upload-event-video: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error in upload-event-video: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Get video information and extract thumbnail
 */
function getVideoInfo($videoPath, $thumbnailPath) {
    // Check if ffmpeg is available
    $ffmpegPath = trim(shell_exec('which ffmpeg 2>/dev/null'));
    
    if (empty($ffmpegPath)) {
        return null;
    }
    
    $info = [];
    
    // Get video dimensions and duration using ffprobe
    $ffprobePath = trim(shell_exec('which ffprobe 2>/dev/null'));
    if (!empty($ffprobePath)) {
        $widthCmd = "{$ffprobePath} -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 \"{$videoPath}\"";
        $heightCmd = "{$ffprobePath} -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 \"{$videoPath}\"";
        $durationCmd = "{$ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{$videoPath}\"";
        
        $width = trim(shell_exec($widthCmd));
        $height = trim(shell_exec($heightCmd));
        $duration = trim(shell_exec($durationCmd));
        
        $info['width'] = (int)$width;
        $info['height'] = (int)$height;
        $info['duration'] = $duration ? (int)round((float)$duration) : null;
    }
    
    // Extract thumbnail from video
    if (!empty($ffmpegPath) && !empty($thumbnailPath)) {
        $thumbnailCmd = "{$ffmpegPath} -i \"{$videoPath}\" -ss 00:00:01 -vframes 1 -q:v 2 \"{$thumbnailPath}\" 2>&1";
        shell_exec($thumbnailCmd);
    }
    
    return $info;
}
?>

