<?php
/**
 * TEMPLATE ONLY — copy to config.php on the OVH server (FTP), never commit config.php.
 *
 * OVH → Web Cloud → Hosting → Databases: copy host, DB name, user, password.
 * Host is usually: something.mysql.db
 */
ini_set('default_socket_timeout', '10');

$host = 'YOURNAME.mysql.db';
$dbname = 'YOUR_DATABASE_NAME';
$username = 'YOUR_DATABASE_USER';
$password = 'YOUR_DATABASE_PASSWORD';

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
    if (!headers_sent()) {
        header('Content-Type: application/json');
    }
    error_log('Database connection failed: ' . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed',
    ]));
}
