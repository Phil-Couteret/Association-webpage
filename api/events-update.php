<?php
session_start();

header('Content-Type: application/json');
// Allow both production and local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/require-admin-section.php';
requireAdminSection('events');

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['id'])) {
        throw new Exception('Event ID is required');
    }

    $eventId = (int)$input['id'];

    // Check if event exists
    $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ?");
    $stmt->execute([$eventId]);
    if (!$stmt->fetch()) {
        throw new Exception('Event not found');
    }

    // Build update query dynamically
    $updateFields = [];
    $params = [];

    if (isset($input['title'])) {
        $updateFields[] = "title = ?";
        $params[] = $input['title'];
    }
    if (isset($input['description'])) {
        $updateFields[] = "description = ?";
        $params[] = $input['description'];
    }
    if (isset($input['date']) && isset($input['time'])) {
        $eventDate = $input['date'] . ' ' . $input['time'] . ':00';
        $dateTime = DateTime::createFromFormat('Y-m-d H:i:s', $eventDate);
        if (!$dateTime) {
            throw new Exception('Invalid date or time format');
        }
        $updateFields[] = "event_date = ?";
        $params[] = $eventDate;
    }
    if (isset($input['location'])) {
        $updateFields[] = "location = ?";
        $params[] = $input['location'];
    }
    if (isset($input['capacity'])) {
        $updateFields[] = "capacity = ?";
        $params[] = $input['capacity'];
    }
    if (isset($input['price'])) {
        $updateFields[] = "price = ?";
        $params[] = $input['price'];
    }
    if (isset($input['status'])) {
        $updateFields[] = "status = ?";
        $params[] = $input['status'];
    }

    if (empty($updateFields)) {
        throw new Exception('No fields to update');
    }

    $params[] = $eventId;
    $sql = "UPDATE events SET " . implode(', ', $updateFields) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // Fetch updated event
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    // Format for frontend
    $eventDate = new DateTime($event['event_date']);
    $event['date'] = $eventDate->format('Y-m-d');
    $event['time'] = $eventDate->format('H:i');
    $event['picture'] = $event['picture'] ? '/' . $event['picture'] : null;
    $event['createdAt'] = $event['created_at'];
    $event['updatedAt'] = $event['updated_at'];
    unset($event['created_at'], $event['updated_at']);

    echo json_encode([
        'success' => true,
        'message' => 'Event updated successfully',
        'event' => $event
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

