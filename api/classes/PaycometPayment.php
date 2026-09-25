<?php
/**
 * Paycomet Payment Handler (Banco Sabadell)
 * Skeleton implementation – awaits API credentials and docs from Paycomet.
 *
 * Paycomet config in payment_config:
 * - api_key_public: (optional) JET ID or similar
 * - api_key_secret: API password
 * - config_json: {"merchant_code":"...","terminal_id":"...","api_url":"..."}
 */

class PaycometPayment {
    private $db;
    private $config = null;
    private $isConfigured = false;

    public function __construct($database) {
        $this->db = $database;
        $this->loadConfig();
    }

    /**
     * Load Paycomet configuration from database
     */
    private function loadConfig() {
        try {
            $tableCheck = $this->db->query("SHOW TABLES LIKE 'payment_config'");
            if ($tableCheck->rowCount() === 0) {
                return;
            }

            $stmt = $this->db->prepare("
                SELECT api_key_public, api_key_secret, webhook_secret, config_json
                FROM payment_config
                WHERE gateway = 'paycomet' AND is_active = 1
                LIMIT 1
            ");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row || empty($row['api_key_secret'])) {
                return;
            }

            $this->config = [
                'api_key_public' => $row['api_key_public'],
                'api_key_secret' => $row['api_key_secret'],
                'webhook_secret' => $row['webhook_secret'],
                'config_json' => $row['config_json'] ? json_decode($row['config_json'], true) : [],
            ];

            // Require merchant_code and terminal_id from config_json (typical Paycomet setup)
            $extra = $this->config['config_json'];
            if (empty($extra['merchant_code']) || empty($extra['terminal_id'])) {
                return;
            }

            $this->isConfigured = true;
        } catch (PDOException $e) {
            error_log("Paycomet config load error: " . $e->getMessage());
        }
    }

    /**
     * Check if Paycomet is properly configured and active
     */
    public function isConfigured(): bool {
        return $this->isConfigured;
    }

    /**
     * Create a Paycomet payment order and return redirect URL.
     * Throws if not configured – implement when Paycomet API docs are available.
     *
     * @param int $memberId
     * @param string $membershipType basic|sponsor|lifetime
     * @param float $amount
     * @param string $currency
     * @return array ['order_id' => string, 'redirect_url' => string, 'amount' => float, 'currency' => string]
     */
    public function createPaymentOrder(int $memberId, string $membershipType, float $amount, string $currency = 'EUR'): array {
        if (!$this->isConfigured) {
            throw new Exception('Paycomet is not configured. Please add merchant credentials in Admin → Payment Configuration.');
        }

        // TODO: Implement when Paycomet API docs are received
        // 1. Call Paycomet REST API to create order
        // 2. Store pending transaction in payment_transactions
        // 3. Return order_id and redirect_url

        throw new Exception('Paycomet integration is not yet implemented. Awaiting API documentation from Banco Sabadell.');
    }

    /**
     * Verify and process Paycomet callback (IPN).
     * Called by callback-paycomet.php when Paycomet sends the result.
     *
     * @param array $payload Raw POST data from Paycomet
     * @return array ['success' => bool, 'order_id' => string, 'member_id' => int, 'amount' => float, ...]
     */
    public function processCallback(array $payload): array {
        if (!$this->isConfigured) {
            throw new Exception('Paycomet is not configured');
        }

        // TODO: Implement when Paycomet callback format is known
        // 1. Verify signature/hash if Paycomet provides one
        // 2. Extract order_id, status, amount
        // 3. Update payment_transactions
        // 4. Return member_id and metadata for member update

        throw new Exception('Paycomet callback handling is not yet implemented.');
    }

    /**
     * Confirm payment when user returns to success URL (optional – callback may handle it).
     * Used if we need to verify order status on return.
     *
     * @param string $orderId Paycomet order ID
     * @return array|null Member update data or null if not found
     */
    public function confirmOrderOnReturn(string $orderId): ?array {
        if (!$this->isConfigured) {
            return null;
        }

        // TODO: Query Paycomet API for order status, or rely on callback
        // For now, check if we have a completed transaction
        try {
            $stmt = $this->db->prepare("
                SELECT member_id, amount, membership_type, membership_start_date, membership_end_date
                FROM payment_transactions
                WHERE transaction_id = ? AND payment_gateway = 'paycomet' AND status = 'completed'
            ");
            $stmt->execute([$orderId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row ?: null;
        } catch (PDOException $e) {
            error_log("Paycomet confirm lookup error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Store pending transaction (for createPaymentOrder)
     */
    public function storeTransaction(
        int $memberId,
        string $transactionId,
        float $amount,
        string $currency,
        string $status,
        string $membershipType,
        ?string $startDate,
        ?string $endDate,
        ?string $gatewayResponse = null
    ): int {
        $stmt = $this->db->prepare("
            INSERT INTO payment_transactions (
                member_id, transaction_id, payment_gateway, amount, currency,
                status, membership_type, membership_start_date, membership_end_date,
                gateway_response
            ) VALUES (?, ?, 'paycomet', ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $memberId, $transactionId, $amount, $currency, $status,
            $membershipType, $startDate, $endDate, $gatewayResponse
        ]);
        return (int) $this->db->lastInsertId();
    }

    /**
     * Update transaction status
     */
    public function updateTransactionStatus(string $transactionId, string $status, ?string $errorMessage = null, ?string $gatewayResponse = null): bool {
        $stmt = $this->db->prepare("
            UPDATE payment_transactions
            SET status = ?, error_message = ?, gateway_response = COALESCE(?, gateway_response), updated_at = CURRENT_TIMESTAMP
            WHERE transaction_id = ? AND payment_gateway = 'paycomet'
        ");
        $stmt->execute([$status, $errorMessage, $gatewayResponse, $transactionId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * Get base URL for callbacks
     */
    private function getBaseUrl(): string {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'www.elektr-ame.com';
        return $protocol . '://' . $host;
    }
}
