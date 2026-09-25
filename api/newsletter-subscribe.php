<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {

    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? null;

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email address');
    }

    // Check if already subscribed
    $stmt = $pdo->prepare("SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = :email");
    $stmt->execute([':email' => $email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        if ($existing['unsubscribed_at'] === null) {
            // Already subscribed
            echo json_encode([
                'success' => true,
                'message' => 'You are already subscribed to our newsletter.',
                'already_subscribed' => true
            ]);
            exit();
        } else {
            // Re-subscribe (was previously unsubscribed)
            $stmt = $pdo->prepare("UPDATE newsletter_subscribers SET unsubscribed_at = NULL, subscribed_at = NOW() WHERE email = :email");
            $stmt->execute([':email' => $email]);
            echo json_encode([
                'success' => true,
                'message' => 'Welcome back! You have been re-subscribed to our newsletter.'
            ]);
            exit();
        }
    }

    // New subscription
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

    $stmt = $pdo->prepare("INSERT INTO newsletter_subscribers (email, ip_address, user_agent) VALUES (:email, :ip, :userAgent)");
    $stmt->execute([
        ':email' => $email,
        ':ip' => $ip,
        ':userAgent' => $userAgent
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Thank you for subscribing! You will receive our latest updates.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

