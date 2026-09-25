<?php
/**
 * Member Directory API
 * Allows logged-in members to view other approved members
 * Privacy: Only shows approved members, excludes sensitive info
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

$currentMemberId = $_SESSION['member_id'];

try {
    // Get search and filter parameters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $role = isset($_GET['role']) ? trim($_GET['role']) : '';
    $city = isset($_GET['city']) ? trim($_GET['city']) : '';
    
    // Build query - only show approved members
    $query = "
        SELECT 
            id,
            first_name,
            second_name,
            last_name,
            artist_name,
            profile_picture,
            bio,
            social_links,
            city,
            country,
            membership_type,
            is_dj,
            is_producer,
            is_vj,
            is_visual_artist,
            is_fan,
            created_at
        FROM members 
        WHERE status = 'approved'
        AND id != :current_member_id
    ";
    
    $params = [':current_member_id' => $currentMemberId];
    
    // Add search filter
    if (!empty($search)) {
        $query .= " AND (
            first_name LIKE :search 
            OR second_name LIKE :search 
            OR last_name LIKE :search 
            OR artist_name LIKE :search 
            OR city LIKE :search
        )";
        $params[':search'] = '%' . $search . '%';
    }
    
    // Add role filter
    if (!empty($role)) {
        $roleColumn = '';
        switch ($role) {
            case 'dj':
                $roleColumn = 'is_dj';
                break;
            case 'producer':
                $roleColumn = 'is_producer';
                break;
            case 'vj':
                $roleColumn = 'is_vj';
                break;
            case 'visual_artist':
                $roleColumn = 'is_visual_artist';
                break;
            case 'fan':
                $roleColumn = 'is_fan';
                break;
        }
        if ($roleColumn) {
            $query .= " AND {$roleColumn} = 1";
        }
    }
    
    // Add city filter
    if (!empty($city)) {
        $query .= " AND city LIKE :city";
        $params[':city'] = '%' . $city . '%';
    }
    
    // Order by name
    $query .= " ORDER BY first_name ASC, last_name ASC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process members data
    foreach ($members as &$member) {
        // Convert role fields to booleans
        $member['is_dj'] = (bool)($member['is_dj'] ?? 0);
        $member['is_producer'] = (bool)($member['is_producer'] ?? 0);
        $member['is_vj'] = (bool)($member['is_vj'] ?? 0);
        $member['is_visual_artist'] = (bool)($member['is_visual_artist'] ?? 0);
        $member['is_fan'] = (bool)($member['is_fan'] ?? 0);
        
        // Parse social_links JSON if it exists
        if (!empty($member['social_links'])) {
            $decoded = json_decode($member['social_links'], true);
            $member['social_links'] = $decoded ?: (object)[];
        } else {
            $member['social_links'] = (object)[];
        }
        
        // Build full name
        $member['full_name'] = trim(
            ($member['first_name'] ?? '') . ' ' . 
            ($member['second_name'] ?? '') . ' ' . 
            ($member['last_name'] ?? '')
        );
        
        // Get roles array
        $roles = [];
        if ($member['is_dj']) $roles[] = 'DJ';
        if ($member['is_producer']) $roles[] = 'Producer';
        if ($member['is_vj']) $roles[] = 'VJ';
        if ($member['is_visual_artist']) $roles[] = 'Visual Artist';
        if ($member['is_fan']) $roles[] = 'Fan';
        $member['roles'] = $roles;
    }
    unset($member); // Break reference
    
    echo json_encode([
        'success' => true,
        'members' => $members,
        'count' => count($members)
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in members-directory: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("Error in members-directory: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred'
    ]);
}
?>

