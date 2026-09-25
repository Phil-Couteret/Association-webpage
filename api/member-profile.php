<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

// Include database configuration
require_once 'config.php';

try {
    // Check if member is logged in via session
    // For now, we'll check if there's a member_id in session
    // You can implement proper member authentication later
    if (!isset($_SESSION['member_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Not authenticated. Please log in or register.'
        ]);
        exit;
    }

    $member_id = $_SESSION['member_id'];

    // Check if newsletter_subscribe column exists
    $hasNewsletterCol = false;
    $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'newsletter_subscribe'");
    if ($colCheck && $colCheck->rowCount() > 0) {
        $hasNewsletterCol = true;
    }
    $newsletterCol = $hasNewsletterCol ? ', newsletter_subscribe' : '';

    // Check if company columns exist (for pay on behalf of company)
    $hasCompanyCol = false;
    $companyColCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'company_name'");
    if ($companyColCheck && $companyColCheck->rowCount() > 0) {
        $hasCompanyCol = true;
    }
    $companyCol = $hasCompanyCol ? ', company_name, company_cif, company_address' : '';

    // Fetch member data
    $stmt = $pdo->prepare("
        SELECT 
            id,
            email,
            first_name,
            second_name,
            artist_name,
            profile_picture,
            bio,
            social_links,
            phone,
            street as address,
            city,
            zip_code as postal_code,
            country
            $companyCol,
            status,
            membership_type,
            membership_start_date,
            membership_end_date,
            payment_status,
            payment_amount,
            inviter_id,
            terms_accepted_at,
            terms_version,
            is_dj,
            is_producer,
            is_vj,
            is_visual_artist,
            is_fan
            $newsletterCol,
            notes,
            created_at
        FROM members 
        WHERE id = ?
    ");

    $stmt->execute([$member_id]);
    $member = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$member) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Member not found'
        ]);
        exit;
    }

    // Convert boolean fields
    $member['is_dj'] = (bool)($member['is_dj'] ?? 0);
    $member['is_producer'] = (bool)$member['is_producer'];
    $member['is_vj'] = (bool)$member['is_vj'];
    $member['is_visual_artist'] = (bool)$member['is_visual_artist'];
    $member['is_fan'] = (bool)($member['is_fan'] ?? 0);
    $member['newsletter_subscribe'] = (bool)($member['newsletter_subscribe'] ?? 0);

    // Fetch pending email change if any
    $pendingStmt = $pdo->prepare("
        SELECT new_email, requested_at, expires_at 
        FROM member_email_change_requests 
        WHERE member_id = ? AND status = 'pending'
        ORDER BY requested_at DESC
        LIMIT 1
    ");
    $pendingStmt->execute([$member_id]);
    $pendingEmailChange = $pendingStmt->fetch(PDO::FETCH_ASSOC);

    // Parse social_links JSON if it exists
    if (!empty($member['social_links'])) {
        $decoded = json_decode($member['social_links'], true);
        $member['social_links'] = $decoded ?: [];
    } else {
        $member['social_links'] = [];
    }

    // Don't send internal notes to member
    unset($member['notes']);

    if ($pendingEmailChange) {
        $member['pending_email_change'] = [
            'new_email' => $pendingEmailChange['new_email'],
            'requested_at' => $pendingEmailChange['requested_at'],
            'expires_at' => $pendingEmailChange['expires_at']
        ];
    }

    echo json_encode([
        'success' => true,
        'member' => $member
    ]);

} catch (PDOException $e) {
    error_log("Database error in member-profile.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error occurred'
    ]);
}
?>

