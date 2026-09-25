<?php
session_start();

ob_start();

header('Content-Type: application/json');
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

// Check if user is authenticated
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';
ob_end_clean();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $eventId = $input['event_id'] ?? $_POST['event_id'] ?? null;
    
    if (!$eventId) {
        throw new Exception('Event ID is required');
    }

    // Update event status to 'archived'
    $stmt = $pdo->prepare("UPDATE events SET status = 'archived' WHERE id = ?");
    $stmt->execute([$eventId]);

    echo json_encode([
        'success' => true,
        'message' => 'Event archived successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in archive-event: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

