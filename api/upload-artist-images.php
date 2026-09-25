<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

$uploadDir = getUploadDirectory('artist-images/');
$thumbnailDir = getUploadDirectory('artist-images/thumbnails/');

try {
    $artistId = $_POST['artist_id'] ?? null;
    
    if (!$artistId) {
        throw new Exception('Artist ID is required');
    }

    $stmt = $pdo->prepare("SELECT id FROM artists WHERE id = ?");
    $stmt->execute([$artistId]);
    if (!$stmt->fetch()) {
        throw new Exception('Artist not found');
    }

    $uploadedCount = 0;
    $errors = [];

    // Handle both 'images' and 'videos' file arrays
    $fileArrays = [];
    if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
        foreach ($_FILES['images']['name'] as $index => $filename) {
            if (!empty($filename)) {
                $fileArrays[] = [
                    'name' => $_FILES['images']['name'][$index],
                    'type' => $_FILES['images']['type'][$index],
                    'tmp_name' => $_FILES['images']['tmp_name'][$index],
                    'error' => $_FILES['images']['error'][$index],
                    'size' => $_FILES['images']['size'][$index],
                    'index' => $index,
                    'source' => 'images'
                ];
            }
        }
    }
    
    if (isset($_FILES['videos']) && is_array($_FILES['videos']['name'])) {
        foreach ($_FILES['videos']['name'] as $index => $filename) {
            if (!empty($filename)) {
                $fileArrays[] = [
                    'name' => $_FILES['videos']['name'][$index],
                    'type' => $_FILES['videos']['type'][$index],
                    'tmp_name' => $_FILES['videos']['tmp_name'][$index],
                    'error' => $_FILES['videos']['error'][$index],
                    'size' => $_FILES['videos']['size'][$index],
                    'index' => $index,
                    'source' => 'videos'
                ];
            }
        }
    }

    foreach ($fileArrays as $fileData) {
        $file = [
            'name' => $fileData['name'],
            'type' => $fileData['type'],
            'tmp_name' => $fileData['tmp_name'],
            'error' => $fileData['error'],
            'size' => $fileData['size']
        ];
        $index = $fileData['index'];
        $source = $fileData['source'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errorMsg = "Error uploading {$file['name']} - ";
            switch ($file['error']) {
                case UPLOAD_ERR_INI_SIZE:
                    $errorMsg .= "File exceeds upload_max_filesize";
                    break;
                case UPLOAD_ERR_FORM_SIZE:
                    $errorMsg .= "File exceeds MAX_FILE_SIZE";
                    break;
                case UPLOAD_ERR_PARTIAL:
                    $errorMsg .= "File was only partially uploaded";
                    break;
                case UPLOAD_ERR_NO_FILE:
                    $errorMsg .= "No file was uploaded";
                    break;
                case UPLOAD_ERR_NO_TMP_DIR:
                    $errorMsg .= "Missing temporary folder";
                    break;
                case UPLOAD_ERR_CANT_WRITE:
                    $errorMsg .= "Failed to write file to disk";
                    break;
                case UPLOAD_ERR_EXTENSION:
                    $errorMsg .= "PHP extension stopped the upload";
                    break;
                default:
                    $errorMsg .= "Unknown error code: {$file['error']}";
            }
            $errors[] = $errorMsg;
            error_log($errorMsg);
            continue;
        }

        // Determine media type and allowed types
        // Check both MIME type and file extension (browsers sometimes send wrong MIME types)
        $isVideo = false;
        $allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
        $allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $allowedVideoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'qt'];
        
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $mimeType = $file['type'];
        
        // Check MIME type first, then fallback to extension or source
        if (in_array($mimeType, $allowedVideoTypes) || in_array($extension, $allowedVideoExtensions) || $source === 'videos') {
            $isVideo = true;
            $maxSize = 100 * 1024 * 1024; // 100MB for videos
        } else if (in_array($mimeType, $allowedImageTypes) || in_array($extension, $allowedImageExtensions)) {
            $maxSize = 10 * 1024 * 1024; // 10MB for images
        } else {
            $errors[] = "Invalid file type for {$file['name']} (type: {$mimeType}, ext: {$extension})";
            continue;
        }

        if ($file['size'] > $maxSize) {
            $errors[] = "File too large for {$file['name']} (max: " . round($maxSize / 1024 / 1024) . "MB)";
            continue;
        }

        // Extension already extracted above
        $uniqueFilename = uniqid() . '_' . time() . '.' . $extension;
        $filePath = $uploadDir . $uniqueFilename;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $error = "Failed to save {$file['name']} to {$filePath}";
            $errors[] = $error;
            error_log($error);
            error_log("Upload dir writable: " . (is_writable($uploadDir) ? 'yes' : 'no'));
            error_log("Upload dir exists: " . (is_dir($uploadDir) ? 'yes' : 'no'));
            continue;
        }
        
        error_log("Successfully saved file to: {$filePath}");

        $width = 0;
        $height = 0;
        $videoDuration = null;
        $thumbnailPath = null;
        $relativeThumbnailPath = null;

        if ($isVideo) {
            // For videos, try to extract thumbnail and duration
            // Note: This requires ffmpeg to be installed on the server
            $thumbnailPath = $thumbnailDir . 'thumb_' . pathinfo($uniqueFilename, PATHINFO_FILENAME) . '.jpg';
            $videoInfo = getVideoInfo($filePath, $thumbnailPath);
            if ($videoInfo) {
                $width = $videoInfo['width'] ?? 0;
                $height = $videoInfo['height'] ?? 0;
                $videoDuration = $videoInfo['duration'] ?? null;
                if (file_exists($thumbnailPath)) {
                    $relativeThumbnailPath = 'public/artist-images/thumbnails/thumb_' . pathinfo($uniqueFilename, PATHINFO_FILENAME) . '.jpg';
                }
            }
        } else {
            // For images, create thumbnail
            $thumbnailPath = $thumbnailDir . 'thumb_' . $uniqueFilename;
            if (createThumbnail($filePath, $thumbnailPath, 300, 300)) {
                $relativeThumbnailPath = 'public/artist-images/thumbnails/thumb_' . $uniqueFilename;
                error_log("Thumbnail created: {$thumbnailPath}");
            } else {
                $error = "Failed to create thumbnail for {$file['name']}";
                $errors[] = $error;
                error_log($error);
            }

            $imageInfo = getimagesize($filePath);
            $width = $imageInfo[0] ?? 0;
            $height = $imageInfo[1] ?? 0;
        }

        $category = $_POST[$source][$index]['category'] ?? 'other';
        $description = $_POST[$source][$index]['description'] ?? '';
        $isProfilePicture = ($_POST[$source][$index]['is_profile_picture'] ?? '0') === '1';

        // Only images can be profile pictures
        if ($isProfilePicture && !$isVideo) {
            $stmt = $pdo->prepare("UPDATE artist_images SET is_profile_picture = 0 WHERE artist_id = ?");
            $stmt->execute([$artistId]);
        } else if ($isProfilePicture && $isVideo) {
            $isProfilePicture = false; // Videos cannot be profile pictures
        }

        $stmt = $pdo->prepare("
            INSERT INTO artist_images 
            (artist_id, filename, filepath, thumbnail_filepath, alt_text, description, category, media_type, is_profile_picture, width, height, file_size, video_duration, uploaded_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");

        $altText = $description ?: ($isVideo ? "Artist video - {$category}" : "Artist image - {$category}");
        // Store path relative to public directory for HTTP access
        $relativeFilePath = 'public/artist-images/' . $uniqueFilename;

        try {
            $stmt->execute([
                $artistId,
                $file['name'],
                $relativeFilePath,
                $relativeThumbnailPath,
                $altText,
                $description,
                $category,
                $isVideo ? 'video' : 'image',
                $isProfilePicture ? 1 : 0,
                $width,
                $height,
                $file['size'],
                $videoDuration
            ]);
            
            error_log("Database insert successful for: {$file['name']}");
            $uploadedCount++;
        } catch (PDOException $e) {
            $error = "Database error for {$file['name']}: " . $e->getMessage();
            $errors[] = $error;
            error_log($error);
            // Clean up uploaded file if database insert failed
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            if (isset($thumbnailPath) && file_exists($thumbnailPath)) {
                unlink($thumbnailPath);
            }
        }
    }

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
            'errors' => $errors
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function createThumbnail($sourcePath, $thumbnailPath, $maxWidth, $maxHeight) {
    $imageInfo = getimagesize($sourcePath);
    if (!$imageInfo) return false;

    $sourceWidth = $imageInfo[0];
    $sourceHeight = $imageInfo[1];
    $mimeType = $imageInfo['mime'];

    $ratio = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
    $thumbWidth = round($sourceWidth * $ratio);
    $thumbHeight = round($sourceHeight * $ratio);

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

    $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);
    
    if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        $transparent = imagecolorallocatealpha($thumbnail, 255, 255, 255, 127);
        imagefill($thumbnail, 0, 0, $transparent);
    }

    imagecopyresampled(
        $thumbnail, $sourceImage,
        0, 0, 0, 0,
        $thumbWidth, $thumbHeight,
        $sourceWidth, $sourceHeight
    );

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

    imagedestroy($sourceImage);
    imagedestroy($thumbnail);

    return $result;
}

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
?>