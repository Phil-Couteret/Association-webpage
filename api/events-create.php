<?php
session_start();

header('Content-Type: application/json');
// Allow both production and local development
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ['https://www.elektr-ame.com', 'http://localhost:8080', 'http://127.0.0.1:8080'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (empty($input['title'])) {
        throw new Exception('Title is required');
    }
    if (empty($input['date']) || empty($input['time'])) {
        throw new Exception('Date and time are required');
    }
    if (empty($input['location'])) {
        throw new Exception('Location is required');
    }

    // Combine date and time into event_date
    $eventDate = $input['date'] . ' ' . $input['time'] . ':00';
    
    // Validate date format
    $dateTime = DateTime::createFromFormat('Y-m-d H:i:s', $eventDate);
    if (!$dateTime) {
        throw new Exception('Invalid date or time format');
    }

    $stmt = $pdo->prepare("
        INSERT INTO events (title, description, event_date, location, capacity, price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $input['title'],
        $input['description'] ?? null,
        $eventDate,
        $input['location'],
        $input['capacity'] ?? null,
        $input['price'] ?? 0.00,
        $input['status'] ?? 'published'  // Default to published so events show on public page
    ]);

    $eventId = $pdo->lastInsertId();

    // Fetch the created event
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    // Format for frontend
    $eventDate = new DateTime($event['event_date']);
    $event['date'] = $eventDate->format('Y-m-d');
    $event['time'] = $eventDate->format('H:i');
    $event['picture'] = $event['picture'] ? '/' . $event['picture'] : null;
    $event['id'] = (string)$event['id']; // Return ID as string for frontend
    $event['createdAt'] = $event['created_at'];
    $event['updatedAt'] = $event['updated_at'];
    unset($event['created_at'], $event['updated_at']);

    echo json_encode([
        'success' => true,
        'message' => 'Event created successfully',
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

