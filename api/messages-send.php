<?php
/**
 * Send Message API
 * Allows members to send messages to other members
 */

// Prevent any output before headers
ob_start();

header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Use config helper for environment-aware CORS
require_once __DIR__ . '/config-helper.php';
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once __DIR__ . '/config.php';

// Clear any output buffer before processing
ob_end_clean();

// Start session
session_start();

// Check if member is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized. Please log in.'
    ]);
    exit;
}

$senderId = $_SESSION['member_id'];

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    $recipientId = isset($input['recipient_id']) ? (int)$input['recipient_id'] : null;
    $subject = isset($input['subject']) ? trim($input['subject']) : '';
    $message = isset($input['message']) ? trim($input['message']) : '';
    
    // Validate required fields
    if (!$recipientId) {
        throw new Exception('Recipient ID is required');
    }
    
    if (empty($message)) {
        throw new Exception('Message content is required');
    }
    
    // Check if recipient exists and is approved
    $stmt = $pdo->prepare("SELECT id, first_name, last_name FROM members WHERE id = ? AND status = 'approved'");
    $stmt->execute([$recipientId]);
    $recipient = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$recipient) {
        throw new Exception('Recipient not found or not approved');
    }
    
    // Prevent sending message to self
    if ($recipientId == $senderId) {
        throw new Exception('Cannot send message to yourself');
    }
    
    // Create messages table if it doesn't exist
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS member_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                recipient_id INT NOT NULL,
                subject VARCHAR(255) NULL,
                message TEXT NOT NULL,
                thread_id INT NULL,
                parent_message_id INT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sender (sender_id),
                INDEX idx_recipient (recipient_id),
                INDEX idx_thread (thread_id),
                INDEX idx_created (created_at),
                FOREIGN KEY (sender_id) REFERENCES members(id) ON DELETE CASCADE,
                FOREIGN KEY (recipient_id) REFERENCES members(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_message_id) REFERENCES member_messages(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } catch (PDOException $e) {
        // If foreign key constraint fails, try without foreign keys
        if (strpos($e->getMessage(), 'foreign key') !== false) {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS member_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    recipient_id INT NOT NULL,
                    subject VARCHAR(255) NULL,
                    message TEXT NOT NULL,
                    thread_id INT NULL,
                    parent_message_id INT NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_sender (sender_id),
                    INDEX idx_recipient (recipient_id),
                    INDEX idx_thread (thread_id),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");
        } else {
            throw $e;
        }
    }
    
    // Determine thread_id (use existing thread or create new)
    $threadId = null;
    if (isset($input['thread_id']) && $input['thread_id']) {
        $threadId = (int)$input['thread_id'];
    } else {
        // Check if there's an existing thread between these two members
        $stmt = $pdo->prepare("
            SELECT thread_id 
            FROM member_messages 
            WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))
            AND thread_id IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$senderId, $recipientId, $recipientId, $senderId]);
        $existingThread = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingThread) {
            $threadId = $existingThread['thread_id'];
        }
    }
    
    $parentMessageId = isset($input['parent_message_id']) ? (int)$input['parent_message_id'] : null;
    
    // Insert message
    $stmt = $pdo->prepare("
        INSERT INTO member_messages (sender_id, recipient_id, subject, message, thread_id, parent_message_id)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $senderId,
        $recipientId,
        $subject ?: null,
        $message,
        $threadId,
        $parentMessageId
    ]);
    
    $messageId = $pdo->lastInsertId();
    
    // If this is a new thread, update the thread_id to point to itself
    if (!$threadId) {
        $stmt = $pdo->prepare("UPDATE member_messages SET thread_id = ? WHERE id = ?");
        $stmt->execute([$messageId, $messageId]);
        $threadId = $messageId;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Message sent successfully',
        'message_id' => $messageId,
        'thread_id' => $threadId
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in messages-send: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("Error in messages-send: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

