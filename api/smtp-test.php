<?php
/**
 * SMTP connection test - admin only
 * Run via: https://www.elektr-ame.com/api/smtp-test.php?to=your@email.com
 * Captures PHPMailer debug output to diagnose delivery issues
 */
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Credentials: true');

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Admin login required']);
    exit;
}

$to = $_GET['to'] ?? $_POST['to'] ?? null;
if (!$to || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Valid ?to=email@example.com required']);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

$configPath = __DIR__ . '/smtp-config.php';
if (!file_exists($configPath)) {
    echo json_encode(['success' => false, 'error' => 'smtp-config.php not found on server']);
    exit;
}

$config = include $configPath;
if (empty($config['enabled'])) {
    echo json_encode(['success' => false, 'error' => 'SMTP disabled in config']);
    exit;
}

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->SMTPDebug = 2;  // 2 = client/server conversation
    $mail->Debugoutput = function ($str, $level) {
        $GLOBALS['smtp_debug'][] = trim($str);
    };
    $mail->Host = $config['host'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['username'];
    $mail->Password = $config['password'];
    $enc = $config['encryption'] ?? 'tls';
    $mail->SMTPSecure = $enc === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : ($enc === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : false);
    $mail->Port = (int)($config['port'] ?? 587);
    $mail->CharSet = PHPMailer::CHARSET_UTF8;

    $mail->setFrom($config['from_email'], $config['from_name']);
    $mail->addReplyTo($config['reply_to'] ?? $config['from_email']);
    $mail->addAddress($to);
    $mail->Subject = 'SMTP test - Elektr-Âme';
    $mail->Body = "If you receive this, SMTP is working correctly.\n\nSent at " . date('Y-m-d H:i:s') . " UTC";

    $GLOBALS['smtp_debug'] = [];
    $result = $mail->send();
    $debug = $GLOBALS['smtp_debug'] ?? [];

    echo json_encode([
        'success' => $result,
        'message' => $result ? 'Test email sent. Check inbox (and spam).' : 'Send failed.',
        'smtp_debug' => $debug,
        'config_used' => [
            'host' => $config['host'],
            'port' => $mail->Port,
            'username' => $config['username'],
        ],
    ], JSON_PRETTY_PRINT);
} catch (PHPMailerException $e) {
    $debug = $GLOBALS['smtp_debug'] ?? [];
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'smtp_debug' => $debug,
    ], JSON_PRETTY_PRINT);
}
