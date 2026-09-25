<?php
/**
 * Serve images dynamically from database filepaths
 * This handles cases where image files exist on the server but paths need resolution
 */

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors, but log them

header('Cache-Control: public, max-age=31536000'); // Cache for 1 year

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/config-helper.php';

try {
    // Get the image path from query string
    $imagePath = $_GET['path'] ?? '';
    
    if (empty($imagePath)) {
        http_response_code(400);
        die('Image path required');
    }
    
    // Security: Only allow paths that start with public/
    if (!preg_match('#^public/(artist-images|gallery-images)/#', $imagePath)) {
        http_response_code(403);
        die('Invalid image path');
    }
    
    // Remove leading slash if present
    $imagePath = ltrim($imagePath, '/');
    
    // Try to find the image in the database first
    $stmt = $pdo->prepare("
        SELECT filepath, media_type 
        FROM artist_images 
        WHERE filepath = ? OR filepath = ?
        LIMIT 1
    ");
    $stmt->execute([$imagePath, '/' . $imagePath]);
    $image = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // If not found in artist_images, check gallery_images
    if (!$image) {
        $stmt = $pdo->prepare("
            SELECT filepath, media_type 
            FROM gallery_images 
            WHERE filepath = ? OR filepath = ?
            LIMIT 1
        ");
        $stmt->execute([$imagePath, '/' . $imagePath]);
        $image = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Determine the actual file path - try multiple locations
    $actualPath = null;
    $filename = basename($imagePath);
    $pathsToTry = [];
    
    // Extract the subdirectory (artist-images or gallery-images)
    if (preg_match('#public/(artist-images|gallery-images)/#', $imagePath, $matches)) {
        $subdir = $matches[1] . '/';
        
        // Try 1: Use getUploadDirectory (same as upload scripts)
        $uploadDir = getUploadDirectory($subdir);
        $pathsToTry[] = $uploadDir . $filename;
        
        // Try 2: Database filepath if available
        if ($image) {
            $dbPath = ltrim($image['filepath'], '/');
            $pathsToTry[] = __DIR__ . '/../' . $dbPath;
        }
        
        // Try 3: Direct path from request
        $pathsToTry[] = __DIR__ . '/../' . ltrim($imagePath, '/');
        
        // Try 4: DOCUMENT_ROOT based path
        if (isset($_SERVER['DOCUMENT_ROOT'])) {
            $pathsToTry[] = $_SERVER['DOCUMENT_ROOT'] . '/' . ltrim($imagePath, '/');
        }
        
        // Try 5: Known OVH paths
        $pathsToTry[] = '/home/elektry/www/' . ltrim($imagePath, '/');
        $pathsToTry[] = '/home/elektry/www/public/' . $subdir . $filename;
    } else {
        // Fallback: try direct paths
        $pathsToTry[] = __DIR__ . '/../' . ltrim($imagePath, '/');
        if (isset($_SERVER['DOCUMENT_ROOT'])) {
            $pathsToTry[] = $_SERVER['DOCUMENT_ROOT'] . '/' . ltrim($imagePath, '/');
        }
    }
    
    // Try each path until we find the file
    foreach ($pathsToTry as $path) {
        if ($path && file_exists($path) && is_file($path)) {
            $actualPath = $path;
            break;
        }
    }
    
    // Debug: Log attempted paths
    error_log("serve-image.php: Request: $imagePath, Tried " . count($pathsToTry) . " paths, Found: " . ($actualPath ?: 'none'));
    
    // Check if file exists
    if ($actualPath && file_exists($actualPath) && is_file($actualPath)) {
        // File exists, serve it
        $mimeType = mime_content_type($actualPath);
        if ($mimeType) {
            header('Content-Type: ' . $mimeType);
        } else {
            // Fallback based on extension
            $ext = strtolower(pathinfo($actualPath, PATHINFO_EXTENSION));
            $mimeTypes = [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                'svg' => 'image/svg+xml',
            ];
            header('Content-Type: ' . ($mimeTypes[$ext] ?? 'image/jpeg'));
        }
        
        // Set proper content length
        header('Content-Length: ' . filesize($actualPath));
        
        // Output the file
        readfile($actualPath);
        exit;
    }
    
    // Debug: Log what we tried
    error_log("serve-image.php: File not found. Tried path: $actualPath, Original request: $imagePath");
    
    // Image not found - return 404 with proper image content type
    http_response_code(404);
    header('Content-Type: image/png');
    // Return a 1x1 transparent PNG
    echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    
} catch (Exception $e) {
    error_log("serve-image.php error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: image/png');
    // Return a 1x1 transparent PNG on error
    echo base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
}
?>

