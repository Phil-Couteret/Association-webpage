<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is logged in as admin
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

// Include database configuration
require_once __DIR__ . '/config.php';

try {

    $input = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $requiredFields = ['first_name', 'last_name', 'email', 'phone', 'city', 'country'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Check if newsletter_subscribe column exists
    $hasNewsletterCol = false;
    $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'newsletter_subscribe'");
    if ($colCheck && $colCheck->rowCount() > 0) {
        $hasNewsletterCol = true;
    }
    $newsletterSubscribe = isset($input['newsletter_subscribe']) ? ($input['newsletter_subscribe'] ? 1 : 0) : 1;

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM members WHERE email = :email");
    $stmt->execute([':email' => $input['email']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'A member with this email already exists']);
        exit();
    }

    // Insert new member
    $newsletterCol = $hasNewsletterCol ? 'newsletter_subscribe,' : '';
    $newsletterVal = $hasNewsletterCol ? ':newsletter_subscribe,' : '';
    $sql = "INSERT INTO members (
        first_name, 
        last_name, 
        second_name,
        artist_name,
        email, 
        phone, 
        street, 
        zip_code, 
        city, 
        country,
        is_dj,
        is_producer,
        is_vj,
        is_visual_artist,
        is_fan,
        $newsletterCol
        status,
        membership_type,
        membership_start_date,
        membership_end_date,
        payment_status,
        last_payment_date,
        payment_amount,
        notes,
        created_at,
        updated_at
    ) VALUES (
        :first_name,
        :last_name,
        :second_name,
        :artist_name,
        :email,
        :phone,
        :street,
        :zip_code,
        :city,
        :country,
        :is_dj,
        :is_producer,
        :is_vj,
        :is_visual_artist,
        :is_fan,
        $newsletterVal
        :status,
        :membership_type,
        :membership_start_date,
        :membership_end_date,
        :payment_status,
        :last_payment_date,
        :payment_amount,
        :notes,
        NOW(),
        NOW()
    )";

    $stmt = $pdo->prepare($sql);
    
    $stmt->bindParam(':first_name', $input['first_name']);
    $stmt->bindParam(':last_name', $input['last_name']);
    $stmt->bindParam(':second_name', $input['second_name']);
    $stmt->bindParam(':artist_name', $input['artist_name']);
    $stmt->bindParam(':email', $input['email']);
    $stmt->bindParam(':phone', $input['phone']);
    $stmt->bindParam(':street', $input['street']);
    $stmt->bindParam(':zip_code', $input['zip_code']);
    $stmt->bindParam(':city', $input['city']);
    $stmt->bindParam(':country', $input['country']);
    $stmt->bindParam(':is_dj', $input['is_dj'], PDO::PARAM_BOOL);
    $stmt->bindParam(':is_producer', $input['is_producer'], PDO::PARAM_BOOL);
    $stmt->bindParam(':is_vj', $input['is_vj'], PDO::PARAM_BOOL);
    $stmt->bindParam(':is_visual_artist', $input['is_visual_artist'], PDO::PARAM_BOOL);
    $stmt->bindParam(':is_fan', $input['is_fan'], PDO::PARAM_BOOL);
    if ($hasNewsletterCol) {
        $stmt->bindValue(':newsletter_subscribe', $newsletterSubscribe, PDO::PARAM_INT);
    }
    $stmt->bindParam(':status', $input['status']);
    $stmt->bindParam(':membership_type', $input['membership_type']);
    $stmt->bindParam(':membership_start_date', $input['membership_start_date']);
    $stmt->bindParam(':membership_end_date', $input['membership_end_date']);
    $stmt->bindParam(':payment_status', $input['payment_status']);
    $stmt->bindParam(':last_payment_date', $input['last_payment_date']);
    $stmt->bindParam(':payment_amount', $input['payment_amount']);
    $stmt->bindParam(':notes', $input['notes']);

    $stmt->execute();
    $newMemberId = $pdo->lastInsertId();

    // If newsletter opt-in, add to newsletter_subscribers
    if ($hasNewsletterCol && $newsletterSubscribe) {
        try {
            $nsCheck = $pdo->prepare("SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = ?");
            $nsCheck->execute([$input['email']]);
            $existing = $nsCheck->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                if ($existing['unsubscribed_at'] !== null) {
                    $pdo->prepare("UPDATE newsletter_subscribers SET unsubscribed_at = NULL, subscribed_at = NOW() WHERE email = ?")->execute([$input['email']]);
                }
            } else {
                $pdo->prepare("INSERT INTO newsletter_subscribers (email) VALUES (?)")->execute([$input['email']]);
            }
        } catch (PDOException $e) {
            error_log("Newsletter subscribe on member create failed: " . $e->getMessage());
        }
    }

    echo json_encode([
        'success' => true, 
        'message' => 'Member created successfully',
        'member_id' => $newMemberId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

