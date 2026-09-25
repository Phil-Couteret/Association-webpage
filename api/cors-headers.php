<?php
/**
 * CORS headers for API endpoints
 * Call this before any output in payment/auth endpoints
 *
 * Allowed origins: production + common dev origins
 * Override via ALLOWED_ORIGINS in config.php if needed
 */
$allowedOrigins = defined('ALLOWED_ORIGINS') ? ALLOWED_ORIGINS : [
    'https://www.elektr-ame.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
