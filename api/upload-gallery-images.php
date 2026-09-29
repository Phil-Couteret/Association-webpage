<?php
// Prevent any output before headers
ob_start();

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
// Prevent caching of API responses
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Use config helper for environment-aware CORS
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Include database configuration
session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';

// Clear any output buffer before processing
ob_end_clean();

// Used by both the Gallery tab and the Events tab (event galleries)
requireAnyAdminSection(['gallery', 'events']);
// Release the session lock so long uploads don't block this admin's other requests
session_write_close();

@set_time_limit(300);

/**
 * Ensure gallery_images supports video columns (production DB may predate migration).
 */
function ensureGalleryVideoColumns(PDO $pdo) {
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
        error_log('ensureGalleryVideoColumns: ' . $e->getMessage());
    }
}

function uploadErrorMessage($code, $filename) {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return "File too large for server upload_max_filesize: {$filename}";
        case UPLOAD_ERR_FORM_SIZE:
            return "File too large for this form limit: {$filename}";
        case UPLOAD_ERR_PARTIAL:
            return "Upload interrupted for {$filename}";
        case UPLOAD_ERR_NO_FILE:
            return "No file received for {$filename}";
        default:
            return "Error uploading {$filename} (code {$code})";
    }
}

// POST body exceeded post_max_size — PHP empties $_POST and $_FILES but still runs the script
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 0 && empty($_FILES) && empty($_POST)) {
    $capMb = getServerUploadCapBytes();
    $capHint = $capMb > 0 ? ' (server limit about ' . round($capMb / (1024 * 1024)) . ' MB)' : '';
    http_response_code(413);
    echo json_encode([
        'success' => false,
        'code' => 'PAYLOAD_TOO_LARGE',
        'message' => 'Upload exceeds server size limit (post_max_size)' . $capHint . '.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

ensureGalleryVideoColumns($pdo);

// Create upload directory if it doesn't exist
// Use environment-aware path (works for both local and OVH)
$uploadDir = getUploadDirectory('gallery-images/');
$thumbnailDir = getUploadDirectory('gallery-images/thumbnails/');

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (!file_exists($thumbnailDir)) {
    mkdir($thumbnailDir, 0755, true);
}

try {
    $uploadedCount = 0;
    $errors = [];

    // Handle file uploads - supports both single and multiple files
    // When using images[] in FormData, PHP structures files as:
    // - Single: $_FILES['images'] is direct file info
    // - Multiple: $_FILES['images'] has ['name'] => array(0 => 'file1.jpg', 1 => 'file2.jpg')
    $files = [];
    
    if (isset($_FILES['images'])) {
        // Check if it's an array structure (multiple files or images[] with one file)
        if (isset($_FILES['images']['name']) && is_array($_FILES['images']['name'])) {
            // Array structure - could be one or multiple files
            foreach ($_FILES['images']['name'] as $index => $filename) {
                if (!empty($filename)) {
                    $files[$index] = [
                        'name' => $_FILES['images']['name'][$index],
                        'type' => $_FILES['images']['type'][$index],
                        'tmp_name' => $_FILES['images']['tmp_name'][$index],
                        'error' => $_FILES['images']['error'][$index],
                        'size' => $_FILES['images']['size'][$index]
                    ];
                }
            }
        } else if (isset($_FILES['images']['name']) && !is_array($_FILES['images']['name'])) {
            // Direct file structure (single file not in array)
            $files[0] = [
                'name' => $_FILES['images']['name'],
                'type' => $_FILES['images']['type'],
                'tmp_name' => $_FILES['images']['tmp_name'],
                'error' => $_FILES['images']['error'],
                'size' => $_FILES['images']['size']
            ];
        }
    }
    
    // Debug: Log file detection
    error_log("Gallery upload: Found " . count($files) . " file(s). FILES structure: " . print_r(array_keys($_FILES), true));
    if (empty($files)) {
        error_log("Gallery upload: No files detected. Full FILES structure: " . print_r($_FILES, true));
        echo json_encode([
            'success' => false,
            'message' => 'No files received. Check server logs for details.',
            'debug' => isset($_FILES) ? 'FILES exists but no files parsed. Structure: ' . print_r(array_keys($_FILES), true) : 'FILES not set',
            'files_debug' => isset($_FILES['images']) ? 'images key exists' : 'images key missing'
        ]);
        exit();
    }

    // Process each uploaded image
    foreach ($files as $index => $file) {
        if (empty($file['name'])) continue;
        
        $filename = $file['name'];

        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = uploadErrorMessage($file['error'], $filename);
            continue;
        }

        // Determine media type and validate
        // Check both MIME type and file extension (browsers sometimes send wrong MIME types)
        $isVideo = false;
        $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        $allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'qt'];
        
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mimeType = $file['type'];
        
        // Check MIME type first, then fallback to extension
        if (in_array($mimeType, $allowedVideoTypes) || in_array($extension, $allowedVideoExtensions)) {
            $isVideo = true;
            $maxSize = getGalleryVideoMaxBytes();
        } else if (in_array($mimeType, $allowedImageTypes) || in_array($extension, $allowedImageExtensions)) {
            $maxSize = 10 * 1024 * 1024; // 10MB for images
        } else {
            $errors[] = "Invalid file type for {$filename} (type: {$mimeType}, ext: {$extension})";
            continue;
        }

        // Validate file size
        if ($file['size'] > $maxSize) {
            $errors[] = "File too large for {$filename} (max: " . round($maxSize / 1024 / 1024) . "MB)";
            continue;
        }

        // Generate unique filename (extension already extracted above)
        $uniqueFilename = uniqid() . '_' . time() . '.' . $extension;
        $filePath = $uploadDir . $uniqueFilename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $errors[] = "Failed to save {$filename}";
            continue;
        }

        $width = 0;
        $height = 0;
        $videoDuration = null;
        $thumbnailPath = null;
        $relativeThumbnailPath = null;

        if ($isVideo) {
            // Skip ffmpeg during upload — large videos can exceed OVH/PHP timeouts and return HTML 502/504.
            // File is stored; thumbnail/duration can be added later if ffmpeg is available offline.
            $width = 0;
            $height = 0;
            $videoDuration = null;
            $relativeThumbnailPath = null;
        } else {
            // For images, create thumbnail
            $thumbnailPath = $thumbnailDir . 'thumb_' . $uniqueFilename;
            if (createThumbnail($filePath, $thumbnailPath, 300, 300)) {
                $relativeThumbnailPath = 'public/gallery-images/thumbnails/thumb_' . $uniqueFilename;
            } else {
                $errors[] = "Failed to create thumbnail for {$filename}";
            }

            // Get image metadata
            $imageInfo = getimagesize($filePath);
            $width = $imageInfo[0] ?? 0;
            $height = $imageInfo[1] ?? 0;
        }

        // Get form data (categories and descriptions arrays)
        $category = $_POST['categories'][$index] ?? 'other';
        $description = $_POST['descriptions'][$index] ?? '';
        $galleryId = isset($_POST['gallery_id']) ? (int)$_POST['gallery_id'] : null;

        // Insert into database
        $stmt = $pdo->prepare("
            INSERT INTO gallery_images 
            (gallery_id, filename, filepath, thumbnail_filepath, alt_text, description, category, media_type, width, height, file_size, video_duration, uploaded_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $altText = $description ?: ($isVideo ? "Gallery video - {$category}" : "Gallery image - {$category}");
        // Store path relative to public directory for HTTP access
        $relativeFilePath = 'public/gallery-images/' . $uniqueFilename;
        
        // Use the thumbnail path that was set above (for videos or images)
        // If no thumbnail was created, set to null for videos, or use default for images
        if (empty($relativeThumbnailPath)) {
            if ($isVideo) {
                $relativeThumbnailPath = null; // Videos might not have thumbnails if ffmpeg isn't available
            } else {
                $relativeThumbnailPath = 'public/gallery-images/thumbnails/thumb_' . $uniqueFilename;
            }
        }

        $stmt->execute([
            $galleryId,
            $filename,
            $relativeFilePath,
            $relativeThumbnailPath,
            $altText,
            $description,
            $category,
            $isVideo ? 'video' : 'image',
            $width,
            $height,
            $file['size'],
            $videoDuration
        ]);

        $uploadedCount++;
    }

    // Return response
    if ($uploadedCount > 0) {
        echo json_encode([
            'success' => true,
            'uploaded_count' => $uploadedCount,
            'message' => "Successfully uploaded {$uploadedCount} file(s)",
            'errors' => $errors
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No files were uploaded',
            'errors' => $errors,
            'debug' => [
                'files_received' => count($files),
                'file_types' => array_map(function($f) { return $f['type'] ?? 'unknown'; }, $files)
            ]
        ]);
    }

} catch (PDOException $e) {
    error_log("Database error in upload-gallery-images: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error in upload-gallery-images: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Create a thumbnail image
 */
function createThumbnail($sourcePath, $thumbnailPath, $maxWidth, $maxHeight) {
    $imageInfo = getimagesize($sourcePath);
    if (!$imageInfo) return false;

    $sourceWidth = $imageInfo[0];
    $sourceHeight = $imageInfo[1];
    $mimeType = $imageInfo['mime'];

    // Calculate thumbnail dimensions
    $ratio = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
    $thumbWidth = round($sourceWidth * $ratio);
    $thumbHeight = round($sourceHeight * $ratio);

    // Create source image resource
    switch ($mimeType) {
        case 'image/jpeg':
            $sourceImage = imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $sourceImage = imagecreatefrompng($sourcePath);
            break;
        case 'image/gif':
            $sourceImage = imagecreatefromgif($sourcePath);
            break;
        case 'image/webp':
            $sourceImage = imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }

    if (!$sourceImage) return false;

    // Create thumbnail
    $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);
    
    // Preserve transparency for PNG and GIF
    if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
        imagefill($thumbnail, 0, 0, $transparent);
    }

    // Resize image
    imagecopyresampled(
        $thumbnail, $sourceImage,
        0, 0, 0, 0,
        $thumbWidth, $thumbHeight,
        $sourceWidth, $sourceHeight
    );

    // Save thumbnail
    $result = false;
    switch ($mimeType) {
        case 'image/jpeg':
            $result = imagejpeg($thumbnail, $thumbnailPath, 85);
            break;
        case 'image/png':
            $result = imagepng($thumbnail, $thumbnailPath, 8);
            break;
        case 'image/gif':
            $result = imagegif($thumbnail, $thumbnailPath);
            break;
        case 'image/webp':
            $result = imagewebp($thumbnail, $thumbnailPath, 85);
            break;
    }

    // Clean up
    imagedestroy($sourceImage);
    imagedestroy($thumbnail);

    return $result;
}

/**
 * Get video information and extract thumbnail
 */
function getVideoInfo($videoPath, $thumbnailPath) {
    // Check if ffmpeg is available
    $ffmpegPath = trim(shell_exec('which ffmpeg 2>/dev/null'));
    
    if (empty($ffmpegPath)) {
        // ffmpeg not available, return basic info
        return null;
    }
    
    $info = [];
    
    // Get video dimensions and duration using ffprobe
    $ffprobePath = trim(shell_exec('which ffprobe 2>/dev/null'));
    if (!empty($ffprobePath)) {
        // Get video dimensions
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
    
    // Extract thumbnail from video (first frame at 1 second)
    if (!empty($ffmpegPath) && !empty($thumbnailPath)) {
        $thumbnailCmd = "{$ffmpegPath} -i \"{$videoPath}\" -ss 00:00:01 -vframes 1 -q:v 2 \"{$thumbnailPath}\" 2>&1";
        shell_exec($thumbnailCmd);
    }
    
    return $info;
}
