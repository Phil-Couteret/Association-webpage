<?php
// Prevent any output before JSON
ob_start();

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

// Clear any output that might have been generated
ob_clean();

require_once __DIR__ . '/config.php';

// Check if user is logged in
if (!isset($_SESSION['member_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

$memberId = $_SESSION['member_id'];

// Register shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error occurred'
        ]);
    }
});

// GET: Get unallocated balance and allocation options
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Check if payment_transactions table exists
        $tableCheck = $pdo->query("SHOW TABLES LIKE 'payment_transactions'");
        $tableExists = $tableCheck && $tableCheck->rowCount() > 0;
        
        $unallocatedBalance = 0.00;
        $allocatedBalance = 0.00;
        $totalBalance = 0.00;
        
        if ($tableExists) {
            // Check if allocated_amount column exists
            $columnCheck = $pdo->query("SHOW COLUMNS FROM payment_transactions LIKE 'allocated_amount'");
            $columnExists = $columnCheck && $columnCheck->rowCount() > 0;
            
            if ($columnExists) {
                // Get unallocated balance (amount - allocated_amount)
                $stmt = $pdo->prepare("
                    SELECT 
                        COALESCE(SUM(amount), 0) as total_amount,
                        COALESCE(SUM(allocated_amount), 0) as total_allocated
                    FROM payment_transactions
                    WHERE member_id = ? AND status = 'completed'
                ");
                $stmt->execute([$memberId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $totalBalance = floatval($result['total_amount'] ?? 0);
                $allocatedBalance = floatval($result['total_allocated'] ?? 0);
                $unallocatedBalance = $totalBalance - $allocatedBalance;
            } else {
                // Column doesn't exist yet - calculate from all completed transactions
                $stmt = $pdo->prepare("
                    SELECT COALESCE(SUM(amount), 0) as total_amount
                    FROM payment_transactions
                    WHERE member_id = ? AND status = 'completed'
                ");
                $stmt->execute([$memberId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $totalBalance = floatval($result['total_amount'] ?? 0);
                $unallocatedBalance = $totalBalance; // Assume all unallocated if column doesn't exist
            }
        }
        
        // Get current membership info
        $memberStmt = $pdo->prepare("
            SELECT 
                membership_type,
                membership_start_date,
                membership_end_date,
                payment_status
            FROM members
            WHERE id = ?
        ");
        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate allocation options
        $BASIC_YEARLY_PRICE = 20.00;
        $options = [];
        
        // Only show sponsor donation option (if amount > €20)
        if ($unallocatedBalance > $BASIC_YEARLY_PRICE) {
            $options[] = [
                'type' => 'sponsor_donation',
                'years' => 1,
                'amount' => $unallocatedBalance,
                'description' => "1 year Sponsor membership with tax benefits (€{$unallocatedBalance})"
            ];
        } else if ($unallocatedBalance == $BASIC_YEARLY_PRICE) {
            // If exactly €20, allocate as 1 year basic membership automatically
            $options[] = [
                'type' => 'membership_years',
                'years' => 1,
                'amount' => $BASIC_YEARLY_PRICE,
                'description' => "1 year Basic membership (€{$BASIC_YEARLY_PRICE})"
            ];
        }
        
        ob_clean();
        echo json_encode([
            'success' => true,
            'unallocated_balance' => round($unallocatedBalance, 2),
            'allocated_balance' => round($allocatedBalance, 2),
            'total_balance' => round($totalBalance, 2),
            'options' => $options,
            'current_membership' => $member
        ]);
        
    } catch (PDOException $e) {
        error_log("Payment allocation GET error: " . $e->getMessage());
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        error_log("Payment allocation GET error: " . $e->getMessage());
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
    exit;
}

// POST: Process allocation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            throw new Exception('Invalid JSON data');
        }
        
        $allocationType = $data['allocation_type'] ?? null;
        $allocationYears = isset($data['allocation_years']) ? (int)$data['allocation_years'] : null;
        
        if (!$allocationType || !in_array($allocationType, ['membership_years', 'sponsor_donation'])) {
            throw new Exception('Invalid allocation type');
        }
        
        // Get unallocated balance
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(amount - COALESCE(allocated_amount, 0)), 0) as unallocated
            FROM payment_transactions
            WHERE member_id = ? AND status = 'completed'
        ");
        $stmt->execute([$memberId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $unallocatedBalance = floatval($result['unallocated'] ?? 0);
        
        // Calculate amount needed
        $BASIC_YEARLY_PRICE = 20.00;
        $amountNeeded = 0;
        
        if ($allocationType === 'membership_years') {
            if (!$allocationYears || $allocationYears < 1) {
                throw new Exception('Invalid number of years');
            }
            $amountNeeded = $allocationYears * $BASIC_YEARLY_PRICE;
        } else {
            // sponsor_donation - use all unallocated balance
            $amountNeeded = $unallocatedBalance;
        }
        
        if ($amountNeeded > $unallocatedBalance) {
            throw new Exception('Insufficient unallocated balance');
        }
        
        // Get transactions with unallocated amounts (oldest first)
        $stmt = $pdo->prepare("
            SELECT 
                id,
                amount,
                COALESCE(allocated_amount, 0) as allocated_amount,
                (amount - COALESCE(allocated_amount, 0)) as available
            FROM payment_transactions
            WHERE member_id = ? AND status = 'completed'
            AND (amount - COALESCE(allocated_amount, 0)) > 0
            ORDER BY created_at ASC
        ");
        $stmt->execute([$memberId]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Allocate amount across transactions
        $remainingToAllocate = $amountNeeded;
        $pdo->beginTransaction();
        
        try {
            foreach ($transactions as $transaction) {
                if ($remainingToAllocate <= 0) break;
                
                $available = floatval($transaction['available']);
                $currentAllocated = floatval($transaction['allocated_amount']);
                $allocateFromThis = min($available, $remainingToAllocate);
                $newAllocated = $currentAllocated + $allocateFromThis;
                
                $updateStmt = $pdo->prepare("
                    UPDATE payment_transactions
                    SET allocated_amount = ?,
                        allocation_type = ?,
                        allocation_years = ?,
                        allocation_date = NOW()
                    WHERE id = ?
                ");
                $updateStmt->execute([
                    $newAllocated,
                    $allocationType,
                    $allocationYears,
                    $transaction['id']
                ]);
                
                $remainingToAllocate -= $allocateFromThis;
            }
            
            if ($remainingToAllocate > 0.01) { // Allow small floating point differences
                throw new Exception('Could not fully allocate amount');
            }
            
            // Update member membership
            $memberStmt = $pdo->prepare("
                SELECT 
                    membership_type,
                    membership_start_date,
                    membership_end_date
                FROM members
                WHERE id = ?
            ");
            $memberStmt->execute([$memberId]);
            $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
            
            $startDate = $member['membership_end_date'] && $member['membership_end_date'] > date('Y-m-d')
                ? $member['membership_end_date']
                : date('Y-m-d');
            
            if ($allocationType === 'membership_years') {
                $endDate = date('Y-m-d', strtotime("+{$allocationYears} years", strtotime($startDate)));
            } else {
                // sponsor_donation - 1 year
                $endDate = date('Y-m-d', strtotime('+1 year', strtotime($startDate)));
            }
            $newMembershipType = 'yearly';
            
            $updateMemberStmt = $pdo->prepare("
                UPDATE members SET
                    membership_type = ?,
                    membership_start_date = ?,
                    membership_end_date = ?,
                    payment_status = 'paid',
                    payment_amount = ?,
                    last_payment_date = CURDATE(),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $updateMemberStmt->execute([
                $newMembershipType,
                $startDate,
                $endDate,
                $amountNeeded,
                $memberId
            ]);
            
            $pdo->commit();
            
            ob_clean();
            echo json_encode([
                'success' => true,
                'message' => 'Allocation processed successfully',
                'allocation' => [
                    'type' => $allocationType,
                    'years' => $allocationYears ?? 1,
                    'amount' => $amountNeeded,
                    'membership_type' => $newMembershipType,
                    'membership_start' => $startDate,
                    'membership_end' => $endDate
                ]
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (PDOException $e) {
        error_log("Payment allocation POST error: " . $e->getMessage());
        ob_clean();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        error_log("Payment allocation POST error: " . $e->getMessage());
        ob_clean();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    exit;
}

