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
    // Handle both JSON and form data
    $input = json_decode(file_get_contents('php://input'), true);
    $imageId = $input['image_id'] ?? $_POST['image_id'] ?? $_GET['image_id'] ?? null;
    $imageIds = $input['image_ids'] ?? $_POST['image_ids'] ?? null;
    
    if (!$imageId && !$imageIds) {
        throw new Exception('Image ID(s) required');
    }

    if ($imageId) {
        $imageIds = [$imageId];
    }

    $deletedCount = 0;
    $errors = [];

    foreach ($imageIds as $id) {
        $stmt = $pdo->prepare("SELECT * FROM gallery_images WHERE id = ?");
        $stmt->execute([$id]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$image) {
            $errors[] = "Image with ID {$id} not found";
            continue;
        }

        $deleteStmt = $pdo->prepare("DELETE FROM gallery_images WHERE id = ?");
        $result = $deleteStmt->execute([$id]);

        if (!$result) {
            $errors[] = "Failed to delete image {$id} from database";
            continue;
        }

        $deletedFiles = [];

        // Use config helper for environment-aware paths
        require_once __DIR__ . '/config-helper.php';
        $uploadBaseDir = getUploadDirectory('gallery-images/');
        
        // Extract filename from filepath (filepath is like 'gallery-images/filename.jpg')
        $mainFilename = basename($image['filepath']);
        $mainFilePath = $uploadBaseDir . $mainFilename;
        
        if (file_exists($mainFilePath)) {
            if (unlink($mainFilePath)) {
                $deletedFiles[] = 'Main image file deleted';
            } else {
                $errors[] = "Failed to delete main image file for ID {$id}";
            }
        }

        // Extract filename from thumbnail_filepath (thumbnail_filepath is like 'gallery-images/thumbnails/thumb_filename.jpg')
        // The path is stored as 'gallery-images/thumbnails/thumb_filename.jpg', so we need to extract just the filename
        $thumbnailPathParts = explode('/', $image['thumbnail_filepath']);
        $thumbnailFilename = end($thumbnailPathParts); // Get the last part (filename)
        $thumbnailFilePath = $uploadBaseDir . 'thumbnails/' . $thumbnailFilename;
        
        if (file_exists($thumbnailFilePath)) {
            if (unlink($thumbnailFilePath)) {
                $deletedFiles[] = 'Thumbnail file deleted';
            } else {
                $errors[] = "Failed to delete thumbnail file for ID {$id}";
            }
        }

        $deletedCount++;
    }

    echo json_encode([
        'success' => true,
        'deleted_count' => $deletedCount,
        'message' => "Successfully deleted {$deletedCount} image(s)",
        'errors' => $errors
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>