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
    $status = $_GET['status'] ?? 'all';
    $limit = (int)($_GET['limit'] ?? 100);
    $offset = (int)($_GET['offset'] ?? 0);

    $sql = "SELECT * FROM events WHERE 1=1";
    $params = [];

    if ($status !== 'all') {
        $sql .= " AND status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY event_date DESC";

    if ($limit > 0) {
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format dates for frontend
    foreach ($events as &$event) {
        $eventDate = new DateTime($event['event_date']);
        $event['date'] = $eventDate->format('Y-m-d');
        $event['time'] = $eventDate->format('H:i');
        $event['picture'] = $event['picture'] ? '/' . $event['picture'] : null;
        $event['status'] = $event['status'] ?? 'published'; // Include status
        $event['createdAt'] = $event['created_at'];
        $event['updatedAt'] = $event['updated_at'];
        unset($event['created_at'], $event['updated_at']);
    }

    echo json_encode([
        'success' => true,
        'events' => $events,
        'count' => count($events)
    ]);

} catch (PDOException $e) {
    error_log("Database error in events-list: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'error' => $e->getMessage(),
        'events' => []
    ]);
    exit();
} catch (Exception $e) {
    error_log("Error in events-list: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'events' => []
    ]);
    exit();
}
?>

