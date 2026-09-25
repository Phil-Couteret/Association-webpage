<?php
session_start();

header('Content-Type: application/json');
// Allow both production and local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: DELETE, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is authenticated
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Support both JSON body and URL parameter
    $artistId = $input['id'] ?? $_GET['id'] ?? null;
    
    if (!$artistId) {
        throw new Exception('Artist ID is required');
    }

    $artistId = (int)$artistId;

    // Check if artist exists
    $stmt = $pdo->prepare("SELECT id FROM artists WHERE id = ?");
    $stmt->execute([$artistId]);
    if (!$stmt->fetch()) {
        throw new Exception('Artist not found');
    }

    // Delete the artist (CASCADE will handle related records in artist_images)
    $stmt = $pdo->prepare("DELETE FROM artists WHERE id = ?");
    $stmt->execute([$artistId]);

    echo json_encode([
        'success' => true,
        'message' => 'Artist deleted successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

