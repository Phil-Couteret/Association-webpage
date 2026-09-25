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

// Check if user is authenticated
if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Database configuration
// Include database configuration
require_once __DIR__ . '/config.php';

try {
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['member_id'])) {
        throw new Exception('Member ID is required');
    }
    
    $memberId = $input['member_id'];
    $updates = [];
    $params = [':id' => $memberId];
    
    // Build dynamic UPDATE query based on provided fields
    if (isset($input['phone'])) {
        $phoneValue = trim((string)$input['phone']);
        if ($phoneValue !== '' && !preg_match('/^\+?[0-9\s\-().]{7,20}$/', $phoneValue)) {
            throw new Exception('Invalid phone format');
        }
        $updates[] = "phone = :phone";
        $params[':phone'] = $phoneValue !== '' ? $phoneValue : null;
    }
    
    if (isset($input['email'])) {
        $emailValueRaw = trim((string)$input['email']);
        $emailValueNormalized = strtolower($emailValueRaw);
        if (!filter_var($emailValueRaw, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        $emailCheck = $pdo->prepare("SELECT id FROM members WHERE LOWER(email) = :email AND id != :id");
        $emailCheck->execute([':email' => $emailValueNormalized, ':id' => $memberId]);
        if ($emailCheck->fetch()) {
            throw new Exception('Email address already in use by another member');
        }
        $updates[] = "email = :email";
        $params[':email'] = $emailValueRaw;
    }
    
    if (isset($input['artist_name'])) {
        $updates[] = "artist_name = :artist_name";
        $params[':artist_name'] = $input['artist_name'];
    }
    
    if (isset($input['country']) && trim((string)$input['country']) !== '') {
        $updates[] = "country = :country";
        $params[':country'] = trim($input['country']);
    }
    
    if (isset($input['is_dj'])) {
        $updates[] = "is_dj = :is_dj";
        $params[':is_dj'] = $input['is_dj'] ? 1 : 0;
    }
    
    if (isset($input['is_producer'])) {
        $updates[] = "is_producer = :is_producer";
        $params[':is_producer'] = $input['is_producer'] ? 1 : 0;
    }
    
    if (isset($input['is_vj'])) {
        $updates[] = "is_vj = :is_vj";
        $params[':is_vj'] = $input['is_vj'] ? 1 : 0;
    }
    
    if (isset($input['is_visual_artist'])) {
        $updates[] = "is_visual_artist = :is_visual_artist";
        $params[':is_visual_artist'] = $input['is_visual_artist'] ? 1 : 0;
    }
    
    if (isset($input['is_fan'])) {
        $updates[] = "is_fan = :is_fan";
        $params[':is_fan'] = $input['is_fan'] ? 1 : 0;
    }
    
    if (isset($input['newsletter_subscribe'])) {
        $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'newsletter_subscribe'");
        if ($colCheck && $colCheck->rowCount() > 0) {
            $updates[] = "newsletter_subscribe = :newsletter_subscribe";
            $params[':newsletter_subscribe'] = $input['newsletter_subscribe'] ? 1 : 0;
        }
    }
    
    if (isset($input['membership_type'])) {
        $validTypes = ['in_progress', 'yearly', 'lifetime'];
        if (!in_array($input['membership_type'], $validTypes)) {
            throw new Exception('Invalid membership type');
        }
        $updates[] = "membership_type = :membership_type";
        $params[':membership_type'] = $input['membership_type'];
    }
    
    if (isset($input['membership_start_date'])) {
        $updates[] = "membership_start_date = :membership_start_date";
        $params[':membership_start_date'] = $input['membership_start_date'];
    }
    
    if (isset($input['membership_end_date'])) {
        $updates[] = "membership_end_date = :membership_end_date";
        $params[':membership_end_date'] = $input['membership_end_date'];
    }
    
    if (isset($input['payment_status'])) {
        $validStatuses = ['unpaid', 'paid', 'overdue'];
        if (!in_array($input['payment_status'], $validStatuses)) {
            throw new Exception('Invalid payment status');
        }
        $updates[] = "payment_status = :payment_status";
        $params[':payment_status'] = $input['payment_status'];
        // Terms accepted when payment recorded (stripe, cash, wire_transfer, paycomet, other)
        if ($input['payment_status'] === 'paid') {
            $updates[] = "terms_accepted_at = COALESCE(terms_accepted_at, NOW())";
            $updates[] = "terms_version = COALESCE(terms_version, '2026-01')";
        }
    }
    
    if (isset($input['last_payment_date'])) {
        $updates[] = "last_payment_date = :last_payment_date";
        $params[':last_payment_date'] = $input['last_payment_date'];
    }
    
    if (isset($input['payment_amount'])) {
        $updates[] = "payment_amount = :payment_amount";
        $params[':payment_amount'] = $input['payment_amount'];
    }

    if (isset($input['payment_method'])) {
        $validMethods = ['stripe', 'cash', 'wire_transfer', 'paycomet', 'other'];
        $method = trim($input['payment_method']);
        if ($method !== '' && !in_array($method, $validMethods)) {
            $method = 'other';
        }
        $updates[] = "payment_method = :payment_method";
        $params[':payment_method'] = $method !== '' ? $method : null;
    }
    
    if (isset($input['notes'])) {
        $updates[] = "notes = :notes";
        $params[':notes'] = $input['notes'];
    }
    
    if (empty($updates)) {
        throw new Exception('No fields to update');
    }
    
    // Always update the updated_at timestamp
    $updates[] = "updated_at = NOW()";
    
    // Get member data before update to detect changes
    $stmtBefore = $pdo->prepare("SELECT payment_status, membership_end_date, payment_amount FROM members WHERE id = :id");
    $stmtBefore->execute([':id' => $memberId]);
    $before = $stmtBefore->fetch(PDO::FETCH_ASSOC);
    
    $sql = "UPDATE members SET " . implode(", ", $updates) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Member not found or no changes made');
    }
    
    // Sync newsletter_subscribers when newsletter_subscribe changes
    if (isset($input['newsletter_subscribe'])) {
        try {
            $colCheck = $pdo->query("SHOW COLUMNS FROM members LIKE 'newsletter_subscribe'");
            if ($colCheck && $colCheck->rowCount() > 0) {
                $memberStmt = $pdo->prepare("SELECT email FROM members WHERE id = ?");
                $memberStmt->execute([$memberId]);
                $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
                $email = $member ? trim($member['email']) : null;
                if ($email) {
                    if ($input['newsletter_subscribe']) {
                        $nsCheck = $pdo->prepare("SELECT id, unsubscribed_at FROM newsletter_subscribers WHERE email = ?");
                        $nsCheck->execute([$email]);
                        $existing = $nsCheck->fetch(PDO::FETCH_ASSOC);
                        if ($existing) {
                            if ($existing['unsubscribed_at'] !== null) {
                                $pdo->prepare("UPDATE newsletter_subscribers SET unsubscribed_at = NULL, subscribed_at = NOW() WHERE email = ?")->execute([$email]);
                            }
                        } else {
                            $pdo->prepare("INSERT INTO newsletter_subscribers (email) VALUES (?)")->execute([$email]);
                        }
                    } else {
                        $pdo->prepare("UPDATE newsletter_subscribers SET unsubscribed_at = NOW() WHERE email = ?")->execute([$email]);
                    }
                }
            }
        } catch (PDOException $e) {
            error_log("Newsletter sync on member update failed: " . $e->getMessage());
        }
    }
    
    // Update invitation status if payment was made
    if ($before && isset($input['payment_status']) && $input['payment_status'] === 'paid' && $before['payment_status'] !== 'paid') {
        // Fetch member email and inviter_id for matching invitations
        $memberStmt = $pdo->prepare("SELECT email, inviter_id FROM members WHERE id = ?");
        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        $memberEmail = $member ? strtolower(trim($member['email'])) : null;
        $inviterId = $member ? $member['inviter_id'] : null;

        $rowsByMemberId = 0;
        $rowsByEmail = 0;
        $rowsByInviter = 0;

        // Method 1: Update by invitee_member_id (most reliable)
        $stmt = $pdo->prepare("
            UPDATE member_invitations 
            SET status = 'payed',
                payed_at = NOW()
            WHERE invitee_member_id = ? 
            AND status IN ('sent', 'registered')
        ");
        $stmt->execute([$memberId]);
        $rowsByMemberId = $stmt->rowCount();
        
        // Method 2: If no rows updated and we have email, try by email (case-insensitive, trimmed)
        if ($rowsByMemberId === 0 && $memberEmail) {
            $stmt = $pdo->prepare("
                UPDATE member_invitations 
                SET status = 'payed',
                    payed_at = NOW(),
                    invitee_member_id = COALESCE(invitee_member_id, ?)
                WHERE LOWER(TRIM(invitee_email)) = ?
                AND status IN ('sent', 'registered')
            ");
            $stmt->execute([$memberId, $memberEmail]);
            $rowsByEmail = $stmt->rowCount();
        }
        
        // Method 3: If still no rows and member has inviter_id, find invitation by inviter + email
        if ($rowsByMemberId === 0 && $rowsByEmail === 0 && $inviterId && $memberEmail) {
            $stmt = $pdo->prepare("
                UPDATE member_invitations 
                SET status = 'payed',
                    payed_at = NOW(),
                    invitee_member_id = COALESCE(invitee_member_id, ?)
                WHERE inviter_id = ?
                AND LOWER(TRIM(invitee_email)) = ?
                AND status IN ('sent', 'registered')
            ");
            $stmt->execute([$memberId, $inviterId, $memberEmail]);
            $rowsByInviter = $stmt->rowCount();
        }
        
        error_log("Invitation payment update: member_id=$memberId, email=$memberEmail, inviter_id=$inviterId, by_member_id=$rowsByMemberId, by_email=$rowsByEmail, by_inviter=$rowsByInviter");
        
        if ($rowsByMemberId === 0 && $rowsByEmail === 0 && $rowsByInviter === 0) {
            error_log("Invitation payment: No invitations found for member_id=$memberId, email=$memberEmail");
        }

        // Insert manual payment into payment_transactions (for history and modify/delete)
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'payment_transactions'");
        if ($tableCheck && $tableCheck->rowCount() > 0) {
            $amount = isset($input['payment_amount']) ? floatval($input['payment_amount']) : 0;
            $membershipType = $input['membership_type'] ?? 'yearly';
            $startDate = $input['membership_start_date'] ?? date('Y-m-d');
            $endDate = $input['membership_end_date'] ?? null;
            $paymentMethod = $input['payment_method'] ?? 'other';
            if ($amount > 0) {
                $txType = ($membershipType === 'lifetime') ? 'lifetime' : ($amount > 20 ? 'sponsor' : 'basic');
                $transactionId = 'manual-' . $memberId . '-' . time() . '-' . bin2hex(random_bytes(4));
                try {
                    $pdo->prepare("
                        INSERT INTO payment_transactions (member_id, transaction_id, payment_gateway, amount, currency, status, membership_type, membership_start_date, membership_end_date, payment_method)
                        VALUES (?, ?, 'bank_transfer', ?, 'EUR', 'completed', ?, ?, ?, ?)
                    ")->execute([$memberId, $transactionId, $amount, $txType, $startDate ?: null, $endDate ?: null, $paymentMethod]);
                } catch (PDOException $e) {
                    error_log("Insert manual payment transaction failed: " . $e->getMessage());
                }
            }
        }

        try {
            require_once __DIR__ . '/classes/EmailAutomation.php';
            $emailAutomation = new EmailAutomation($pdo);
            // Send payment confirmation + tax receipt (for any amount >= €20)
            $emailAutomation->sendPaymentRecordedEmails($memberId);
        } catch (Exception $e) {
            error_log("Payment recorded emails failed: " . $e->getMessage());
            // Don't fail the update if email fails
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Member updated successfully'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

