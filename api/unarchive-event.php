<?php
ob_start();

header('Content-Type: application/json');
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
ob_end_clean();

requireAdminSection('events');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $eventId = $input['event_id'] ?? $_POST['event_id'] ?? null;
    
    if (!$eventId) {
        throw new Exception('Event ID is required');
    }

    // Update event status back to 'published'
    $stmt = $pdo->prepare("UPDATE events SET status = 'published' WHERE id = ?");
    $stmt->execute([$eventId]);

    echo json_encode([
        'success' => true,
        'message' => 'Event restored to published successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Database error in unarchive-event: " . $e->getMessage());
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

