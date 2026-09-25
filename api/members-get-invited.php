<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

require_once __DIR__ . '/config.php';

try {
    // Check if member is logged in
    if (!isset($_SESSION['member_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Not authenticated. Please log in.'
        ]);
        exit;
    }

    $inviterId = $_SESSION['member_id'];

    // Fetch all members invited by this member
    $stmt = $pdo->prepare("
        SELECT 
            id,
            first_name,
            second_name,
            artist_name,
            email,
            status,
            membership_type,
            payment_status,
            membership_start_date,
            membership_end_date,
            created_at
        FROM members
        WHERE inviter_id = ?
        ORDER BY created_at DESC
    ");

    $stmt->execute([$inviterId]);
    $invitedMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'invited_members' => $invitedMembers,
        'count' => count($invitedMembers)
    ]);

} catch (PDOException $e) {
    error_log("Database error in members-get-invited.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
}
?>

