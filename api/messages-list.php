<?php
/**
 * List Messages API
 * Returns all messages for the logged-in member, grouped by thread
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

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

$memberId = $_SESSION['member_id'];

try {
    // Check if member_messages table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'member_messages'");
    $tableExists = $tableCheck->rowCount() > 0;
    
    if (!$tableExists) {
        // Table doesn't exist yet, return empty threads
        echo json_encode([
            'success' => true,
            'threads' => [],
            'count' => 0
        ]);
        exit;
    }
    
    // Get all messages where member is sender or recipient
    $stmt = $pdo->prepare("
        SELECT 
            m.id,
            m.sender_id,
            m.recipient_id,
            m.subject,
            m.message,
            m.thread_id,
            m.parent_message_id,
            m.is_read,
            m.created_at,
            sender.first_name as sender_first_name,
            sender.last_name as sender_last_name,
            sender.artist_name as sender_artist_name,
            sender.profile_picture as sender_profile_picture,
            recipient.first_name as recipient_first_name,
            recipient.last_name as recipient_last_name,
            recipient.artist_name as recipient_artist_name,
            recipient.profile_picture as recipient_profile_picture
        FROM member_messages m
        LEFT JOIN members sender ON m.sender_id = sender.id
        LEFT JOIN members recipient ON m.recipient_id = recipient.id
        WHERE m.sender_id = ? OR m.recipient_id = ?
        ORDER BY m.thread_id DESC, m.created_at ASC
    ");
    
    $stmt->execute([$memberId, $memberId]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group messages by thread
    $threads = [];
    foreach ($messages as $msg) {
        $threadId = $msg['thread_id'] ?: $msg['id'];
        
        if (!isset($threads[$threadId])) {
            // Determine the other participant
            $otherId = $msg['sender_id'] == $memberId ? $msg['recipient_id'] : $msg['sender_id'];
            $otherName = $msg['sender_id'] == $memberId 
                ? trim(($msg['recipient_first_name'] ?? '') . ' ' . ($msg['recipient_last_name'] ?? ''))
                : trim(($msg['sender_first_name'] ?? '') . ' ' . ($msg['sender_last_name'] ?? ''));
            $otherArtistName = $msg['sender_id'] == $memberId 
                ? $msg['recipient_artist_name'] 
                : $msg['sender_artist_name'];
            $otherProfilePicture = $msg['sender_id'] == $memberId 
                ? $msg['recipient_profile_picture'] 
                : $msg['sender_profile_picture'];
            
            $threads[$threadId] = [
                'thread_id' => $threadId,
                'other_member_id' => $otherId,
                'other_member_name' => $otherName,
                'other_member_artist_name' => $otherArtistName,
                'other_member_profile_picture' => $otherProfilePicture,
                'last_message_at' => $msg['created_at'],
                'unread_count' => 0,
                'messages' => []
            ];
        }
        
        // Add message to thread
        $threads[$threadId]['messages'][] = [
            'id' => $msg['id'],
            'sender_id' => $msg['sender_id'],
            'recipient_id' => $msg['recipient_id'],
            'subject' => $msg['subject'],
            'message' => $msg['message'],
            'parent_message_id' => $msg['parent_message_id'],
            'is_read' => (bool)$msg['is_read'],
            'created_at' => $msg['created_at'],
            'is_from_me' => $msg['sender_id'] == $memberId
        ];
        
        // Update unread count
        if ($msg['recipient_id'] == $memberId && !$msg['is_read']) {
            $threads[$threadId]['unread_count']++;
        }
        
        // Update last message time
        if ($msg['created_at'] > $threads[$threadId]['last_message_at']) {
            $threads[$threadId]['last_message_at'] = $msg['created_at'];
        }
    }
    
    // Convert to array and sort by last message time
    $threadsArray = array_values($threads);
    usort($threadsArray, function($a, $b) {
        return strtotime($b['last_message_at']) - strtotime($a['last_message_at']);
    });
    
    echo json_encode([
        'success' => true,
        'threads' => $threadsArray,
        'count' => count($threadsArray)
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in messages-list: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("Error in messages-list: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred'
    ]);
}
?>

