<?php
/**
 * Admin: List, update, delete payment transactions for a member
 */
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.elektr-ame.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

require_once __DIR__ . '/config.php';

try {
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'payment_transactions'");
    if (!$tableCheck || $tableCheck->rowCount() === 0) {
        throw new Exception('Payment transactions table does not exist');
    }

    // GET: List payments for member
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $memberId = isset($_GET['member_id']) ? (int)$_GET['member_id'] : 0;
        if ($memberId <= 0) {
            throw new Exception('Invalid member_id');
        }

        $stmt = $pdo->prepare("
            SELECT id, transaction_id, payment_gateway, amount, currency, status,
                   membership_type, membership_start_date, membership_end_date,
                   payment_method, created_at, updated_at
            FROM payment_transactions
            WHERE member_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$memberId]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $payments = [];
        foreach ($transactions as $t) {
            $payments[] = [
                'id' => (int)$t['id'],
                'transaction_id' => $t['transaction_id'],
                'gateway' => $t['payment_gateway'],
                'amount' => floatval($t['amount']),
                'currency' => $t['currency'] ?? 'EUR',
                'status' => $t['status'],
                'membership_type' => $t['membership_type'],
                'membership_start_date' => $t['membership_start_date'],
                'membership_end_date' => $t['membership_end_date'],
                'payment_method' => $t['payment_method'],
                'created_at' => $t['created_at'],
                'updated_at' => $t['updated_at'],
            ];
        }

        echo json_encode(['success' => true, 'payments' => $payments]);
        exit();
    }

    // POST: Update or delete
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    $action = $input['action'] ?? '';
    if ($action === 'delete') {
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        if ($id <= 0) {
            throw new Exception('Invalid payment id');
        }

        $stmt = $pdo->prepare("SELECT member_id FROM payment_transactions WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new Exception('Payment not found');
        }

        $pdo->prepare("DELETE FROM payment_transactions WHERE id = ?")->execute([$id]);
        syncMemberFromTransactions($pdo, (int)$row['member_id']);
        echo json_encode(['success' => true, 'message' => 'Payment deleted']);
        exit();
    }

    if ($action === 'update') {
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        if ($id <= 0) {
            throw new Exception('Invalid payment id');
        }

        $stmt = $pdo->prepare("SELECT member_id FROM payment_transactions WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new Exception('Payment not found');
        }

        $updates = [];
        $params = [':id' => $id];

        $allowed = ['amount', 'currency', 'status', 'membership_type', 'membership_start_date', 'membership_end_date', 'payment_method'];
        $validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];
        $validTypes = ['free', 'basic', 'sponsor', 'lifetime']; // transaction types (members table uses in_progress, yearly, lifetime)

        if (isset($input['amount']) && is_numeric($input['amount'])) {
            $updates[] = "amount = :amount";
            $params[':amount'] = $input['amount'];
        }
        if (isset($input['currency'])) {
            $updates[] = "currency = :currency";
            $params[':currency'] = substr($input['currency'], 0, 3);
        }
        if (isset($input['status']) && in_array($input['status'], $validStatuses)) {
            $updates[] = "status = :status";
            $params[':status'] = $input['status'];
        }
        if (isset($input['membership_type']) && in_array($input['membership_type'], $validTypes)) {
            $updates[] = "membership_type = :membership_type";
            $params[':membership_type'] = $input['membership_type'];
        }
        if (isset($input['membership_start_date'])) {
            $updates[] = "membership_start_date = :membership_start_date";
            $params[':membership_start_date'] = $input['membership_start_date'] ?: null;
        }
        if (isset($input['membership_end_date'])) {
            $updates[] = "membership_end_date = :membership_end_date";
            $params[':membership_end_date'] = $input['membership_end_date'] ?: null;
        }
        if (isset($input['payment_method'])) {
            $validMethods = ['stripe', 'cash', 'wire_transfer', 'paycomet', 'other'];
            $method = in_array($input['payment_method'], $validMethods) ? $input['payment_method'] : 'other';
            $updates[] = "payment_method = :payment_method";
            $params[':payment_method'] = $method;
        }

        if (empty($updates)) {
            throw new Exception('No fields to update');
        }

        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $sql = "UPDATE payment_transactions SET " . implode(", ", $updates) . " WHERE id = :id";
        $pdo->prepare($sql)->execute($params);

        syncMemberFromTransactions($pdo, (int)$row['member_id']);
        echo json_encode(['success' => true, 'message' => 'Payment updated']);
        exit();
    }

    throw new Exception('Invalid action. Use action: "update" or "delete"');

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Recalculate members.payment_amount, last_payment_date from latest completed transaction
 */
function syncMemberFromTransactions($pdo, $memberId) {
    $stmt = $pdo->prepare("
        SELECT amount, membership_type, membership_start_date, membership_end_date, payment_method, created_at
        FROM payment_transactions
        WHERE member_id = ? AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$memberId]);
    $latest = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($latest) {
        $txType = $latest['membership_type'];
        $memberType = $txType === 'free' ? 'in_progress' : ($txType === 'lifetime' ? 'lifetime' : 'yearly');
        $pdo->prepare("
            UPDATE members SET
                payment_amount = ?,
                last_payment_date = DATE(?),
                payment_method = ?,
                membership_type = ?,
                membership_start_date = ?,
                membership_end_date = ?,
                payment_status = 'paid',
                terms_accepted_at = COALESCE(terms_accepted_at, NOW()),
                terms_version = COALESCE(terms_version, '2026-01'),
                updated_at = NOW()
            WHERE id = ?
        ")->execute([
            $latest['amount'],
            $latest['created_at'],
            $latest['payment_method'],
            $memberType,
            $latest['membership_start_date'],
            $latest['membership_end_date'],
            $memberId
        ]);
    } else {
        $pdo->prepare("
            UPDATE members SET
                payment_amount = NULL,
                last_payment_date = NULL,
                payment_method = NULL,
                payment_status = 'unpaid',
                updated_at = NOW()
            WHERE id = ?
        ")->execute([$memberId]);
    }
}
