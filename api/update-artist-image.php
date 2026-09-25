<?php
ob_start(); // Prevent any output before headers

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';
ob_end_clean(); // Clear any output buffer

try {
    // Handle both JSON and form data
    $input = json_decode(file_get_contents('php://input'), true);
    $imageId = $input['image_id'] ?? $_POST['image_id'] ?? null;
    
    if (!$imageId) {
        throw new Exception('Image ID is required');
    }

    // Check if image exists
    $stmt = $pdo->prepare("SELECT * FROM artist_images WHERE id = ?");
    $stmt->execute([$imageId]);
    $image = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$image) {
        throw new Exception('Image not found');
    }

    // Build update query dynamically
    $updateFields = [];
    $params = [];

    if (isset($input['alt_text'])) {
        $updateFields[] = "alt_text = ?";
        $params[] = $input['alt_text'];
    }
    
    if (isset($input['description'])) {
        $updateFields[] = "description = ?";
        $params[] = $input['description'];
    }
    
    if (isset($input['category'])) {
        $updateFields[] = "category = ?";
        $params[] = $input['category'];
    }
    
    if (isset($input['is_profile_picture'])) {
        $isProfilePicture = $input['is_profile_picture'] ? 1 : 0;
        
        // If setting as profile picture, unset others for this artist
        if ($isProfilePicture) {
            $unsetStmt = $pdo->prepare("UPDATE artist_images SET is_profile_picture = 0 WHERE artist_id = ?");
            $unsetStmt->execute([$image['artist_id']]);
        }
        
        $updateFields[] = "is_profile_picture = ?";
        $params[] = $isProfilePicture;
    }

    if (empty($updateFields)) {
        throw new Exception('No fields to update');
    }

    $params[] = $imageId;
    $sql = "UPDATE artist_images SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Fetch updated image
    $stmt = $pdo->prepare("SELECT * FROM artist_images WHERE id = ?");
    $stmt->execute([$imageId]);
    $updatedImage = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Image updated successfully',
        'image' => $updatedImage
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in update-artist-image: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    error_log("Error in update-artist-image: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

