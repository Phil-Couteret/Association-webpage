<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

try {
    $artistId = $_GET['artist_id'] ?? 1;
    
    // Get latest uploads for this artist
    $stmt = $pdo->prepare("
        SELECT id, filename, filepath, media_type, file_size, uploaded_at
        FROM artist_images 
        WHERE artist_id = ?
        ORDER BY uploaded_at DESC
        LIMIT 5
    ");
    $stmt->execute([$artistId]);
    $dbRecords = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check which files exist on disk
    foreach ($dbRecords as &$record) {
        $fullPath = __DIR__ . '/../' . $record['filepath'];
        $record['file_exists_on_disk'] = file_exists($fullPath);
        $record['file_size_on_disk'] = file_exists($fullPath) ? filesize($fullPath) : 0;
        $record['can_read'] = file_exists($fullPath) && is_readable($fullPath);
        $record['web_url'] = '/' . $record['filepath'];
    }
    
    // List actual files in directory
    $uploadDir = __DIR__ . '/../public/artist-images/';
    $filesOnDisk = [];
    if (is_dir($uploadDir)) {
        $files = array_diff(scandir($uploadDir), ['.', '..', 'thumbnails']);
        foreach ($files as $file) {
            if (is_file($uploadDir . $file)) {
                $filesOnDisk[] = [
                    'filename' => $file,
                    'size' => filesize($uploadDir . $file),
                    'in_database' => false
                ];
            }
        }
    }
    
    // Mark which disk files are in database
    foreach ($filesOnDisk as &$diskFile) {
        foreach ($dbRecords as $dbRecord) {
            if (strpos($dbRecord['filepath'], $diskFile['filename']) !== false) {
                $diskFile['in_database'] = true;
                $diskFile['db_id'] = $dbRecord['id'];
                break;
            }
        }
    }
    
    echo json_encode([
        'success' => true,
        'database_records' => $dbRecords,
        'files_on_disk' => $filesOnDisk,
        'orphaned_db' => array_filter($dbRecords, fn($r) => !$r['file_exists_on_disk']),
        'orphaned_disk' => array_filter($filesOnDisk, fn($f) => !$f['in_database'])
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

