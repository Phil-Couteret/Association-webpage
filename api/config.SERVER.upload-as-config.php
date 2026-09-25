<?php
/**
 * PRODUCTION (OVH) — Upload this file to the server as:  www/api/config.php
 *
 * Your LOCAL repo file api/config.php is gitignored and is often an SSH-tunnel
 * (127.0.0.1). That must NEVER be the file on OVH — use THIS structure instead.
 *
 * 1. In OVH → Databases, confirm host / database name / user (often all same prefix).
 * 2. Set $password to the database password from the panel (same as phpMyAdmin).
 * 3. FTP: upload and rename to config.php (replace the broken one).
 *
 * Host below matches your project naming (elektry2025.*). If the panel shows
 * something different, use the panel values exactly.
 */
ini_set('default_socket_timeout', '10');

$host = 'elektry2025.mysql.db';
$dbname = 'elektry2025';
$username = 'elektry2025';
$password = 'REPLACE_WITH_PASSWORD_FROM_OVH_DATABASE_PANEL';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}
