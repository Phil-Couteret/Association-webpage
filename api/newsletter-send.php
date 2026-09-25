<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {

    $input = json_decode(file_get_contents('php://input'), true);
    $subject = $input['subject'] ?? null;
    $content = $input['content'] ?? null;

    if (!$subject || !$content) {
        throw new Exception('Subject and content are required');
    }

    // Get all active subscribers
    $stmt = $pdo->query("
        SELECT id, email, unsubscribe_token 
        FROM newsletter_subscribers 
        WHERE unsubscribed_at IS NULL
    ");
    $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($subscribers) === 0) {
        throw new Exception('No active subscribers to send to');
    }

    // Generate unsubscribe tokens for subscribers that don't have one
    foreach ($subscribers as &$subscriber) {
        if (empty($subscriber['unsubscribe_token'])) {
            $token = bin2hex(random_bytes(32));
            $updateStmt = $pdo->prepare("UPDATE newsletter_subscribers SET unsubscribe_token = :token WHERE id = :id");
            $updateStmt->execute([':token' => $token, ':id' => $subscriber['id']]);
            $subscriber['unsubscribe_token'] = $token;
        }
    }

    $sentCount = 0;
    $failedCount = 0;
    $errors = [];

    // Email configuration
    $fromEmail = 'noreply@elektr-ame.com';
    $fromName = 'Elektr-Âme';
    $replyTo = 'contact@elektr-ame.com';

    // Send emails
    foreach ($subscribers as $subscriber) {
        $unsubscribeUrl = "https://www.elektr-ame.com/api/newsletter-unsubscribe.php?token=" . $subscriber['unsubscribe_token'];
        
        // Create HTML email with unsubscribe link
        $htmlContent = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #4A90E2; }
        .header h1 { margin: 0; color: #4A90E2; }
        .content { padding: 30px 0; }
        .footer { padding: 20px 0; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #888; }
        .footer a { color: #4A90E2; text-decoration: none; }
        .unsubscribe { margin-top: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px; text-align: center; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Elektr-Âme</h1>
        </div>
        <div class='content'>
            " . nl2br(htmlspecialchars($content, ENT_QUOTES, 'UTF-8')) . "
        </div>
        <div class='footer'>
            <p>© " . date('Y') . " Elektr-Âme. All rights reserved.</p>
            <p>Barcelona's Electronic Music Community</p>
            <div class='unsubscribe'>
                <p><a href='{$unsubscribeUrl}'>Unsubscribe from this newsletter</a></p>
            </div>
        </div>
    </div>
</body>
</html>";

        require_once __DIR__ . '/classes/Mailer.php';
        if (Mailer::send($subscriber['email'], $subject, $htmlContent, ['isHtml' => true])) {
            $sentCount++;
        } else {
            $failedCount++;
            $errors[] = $subscriber['email'];
        }

        // Small delay to avoid overwhelming the mail server
        usleep(100000); // 0.1 second delay
    }

    // Save campaign to database
    $stmt = $pdo->prepare("
        INSERT INTO newsletter_campaigns (subject, content, sent_by, recipients_count)
        VALUES (:subject, :content, :sent_by, :recipients_count)
    ");
    $stmt->execute([
        ':subject' => $subject,
        ':content' => $content,
        ':sent_by' => $_SESSION['admin_id'],
        ':recipients_count' => $sentCount
    ]);

    echo json_encode([
        'success' => true,
        'sent' => $sentCount,
        'failed' => $failedCount,
        'total' => count($subscribers),
        'errors' => $errors
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

