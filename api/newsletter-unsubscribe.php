<?php
header('Content-Type: text/html; charset=UTF-8');

// Include database configuration
require_once __DIR__ . '/config.php';

$token = $_GET['token'] ?? null;

if (!$token) {
    die('Invalid unsubscribe link.');
}

try {

    // Find subscriber by token
    $stmt = $pdo->prepare("SELECT id, email, unsubscribed_at FROM newsletter_subscribers WHERE unsubscribe_token = :token");
    $stmt->execute([':token' => $token]);
    $subscriber = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$subscriber) {
        die('Invalid unsubscribe link.');
    }

    if ($subscriber['unsubscribed_at']) {
        // Already unsubscribed
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <title>Already Unsubscribed - Elektr-Âme</title>
            <style>
                body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #1a0b2e 0%, #000000 50%, #4A90E2 100%); margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
                h1 { color: #4A90E2; margin-bottom: 20px; }
                p { color: #666; line-height: 1.8; }
                a { color: #4A90E2; text-decoration: none; font-weight: bold; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✓ Already Unsubscribed</h1>
                <p>You have already unsubscribed from our newsletter.</p>
                <p>You will not receive any more emails from us.</p>
                <p><a href="https://www.elektr-ame.com">← Return to Elektr-Âme</a></p>
            </div>
        </body>
        </html>
        <?php
    } else {
        // Unsubscribe the user
        $stmt = $pdo->prepare("UPDATE newsletter_subscribers SET unsubscribed_at = NOW() WHERE id = :id");
        $stmt->execute([':id' => $subscriber['id']]);
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <title>Unsubscribed Successfully - Elektr-Âme</title>
            <style>
                body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #1a0b2e 0%, #000000 50%, #4A90E2 100%); margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 500px; text-align: center; }
                h1 { color: #4A90E2; margin-bottom: 20px; }
                p { color: #666; line-height: 1.8; }
                a { color: #4A90E2; text-decoration: none; font-weight: bold; }
                a:hover { text-decoration: underline; }
                .email { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✓ Unsubscribed Successfully</h1>
                <div class="email"><?php echo htmlspecialchars($subscriber['email']); ?></div>
                <p>You have been successfully removed from our newsletter mailing list.</p>
                <p>We're sorry to see you go! If you change your mind, you can always resubscribe from our website.</p>
                <p><a href="https://www.elektr-ame.com">← Return to Elektr-Âme</a></p>
            </div>
        </body>
        </html>
        <?php
    }

} catch (PDOException $e) {
    die('Database error. Please try again later.');
}
?>

