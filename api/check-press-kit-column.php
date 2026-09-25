<?php
// Check if press_kit_url column exists in artists table
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

try {
    // Check if column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM artists LIKE 'press_kit_url'");
    $columnExists = $stmt->fetch() !== false;
    
    // Also check for stream columns
    $stmt = $pdo->query("SHOW COLUMNS FROM artists LIKE 'stream1_url'");
    $streamColumnsExist = $stmt->fetch() !== false;
    
    // Get table structure
    $stmt = $pdo->query("DESCRIBE artists");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $columnNames = array_column($columns, 'Field');
    
    echo json_encode([
        'success' => true,
        'press_kit_url_exists' => $columnExists,
        'stream_columns_exist' => $streamColumnsExist,
        'all_columns' => $columnNames,
        'message' => $columnExists 
            ? 'press_kit_url column exists' 
            : 'press_kit_url column DOES NOT exist - run migration: database/artists-add-press-kit.sql'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

