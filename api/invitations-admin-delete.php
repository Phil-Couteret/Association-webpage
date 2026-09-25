<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

require_once __DIR__ . '/config.php';

try {
    // Check if user is admin
    if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Unauthorized. Admin access required.'
        ]);
        exit;
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['invitation_id'])) {
        throw new Exception('Invitation ID is required');
    }

    $invitationId = (int)$input['invitation_id'];

    // Check if invitation exists
    $stmt = $pdo->prepare("SELECT id, status FROM member_invitations WHERE id = ?");
    $stmt->execute([$invitationId]);
    $invitation = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invitation) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Invitation not found'
        ]);
        exit;
    }

    // Delete invitation
    $stmt = $pdo->prepare("DELETE FROM member_invitations WHERE id = ?");
    $stmt->execute([$invitationId]);

    if ($stmt->rowCount() === 0) {
        throw new Exception('Failed to delete invitation');
    }

    error_log("Admin deleted invitation ID: {$invitationId}");

    echo json_encode([
        'success' => true,
        'message' => 'Invitation deleted successfully'
    ]);

} catch (PDOException $e) {
    error_log("Database error in invitations-admin-delete.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

