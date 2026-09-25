<?php
/**
 * RedSys (Redirección) — Banco Sabadell / TPV virtual
 * Firma: HMAC SHA256 sobre Ds_MerchantParameters (Base64 JSON).
 */

class RedsysPayment {
    private $db;
    private $merchantCode = '';
    private $terminal = '001';
    private $secretKey = '';
    /** @var 'test'|'production' */
    private $environment = 'test';
    private $configured = false;

    private const TEST_URL = 'https://sis-t.redsys.es:25443/sis/realizarPago';
    private const PROD_URL = 'https://sis.redsys.es/sis/realizarPago';

    public function __construct(PDO $database) {
        $this->db = $database;
        $this->loadConfig();
    }

    public function isConfigured(): bool {
        return $this->configured;
    }

    private function loadConfig(): void {
        try {
            $stmt = $this->db->prepare("
                SELECT api_key_secret, config_json
                FROM payment_config
                WHERE gateway = 'redsys' AND is_active = 1
                LIMIT 1
            ");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $json = $row['config_json'] ? json_decode($row['config_json'], true) : [];
                $this->merchantCode = trim((string)($json['merchant_code'] ?? ''));
                $this->terminal = trim((string)($json['terminal'] ?? '001'));
                $this->secretKey = trim((string)($row['api_key_secret'] ?? $json['secret_key'] ?? ''));
                $env = strtolower((string)($json['environment'] ?? 'test'));
                $this->environment = ($env === 'production') ? 'production' : 'test';
                if ($this->merchantCode !== '' && $this->secretKey !== '') {
                    $this->configured = true;
                    return;
                }
            }
        } catch (PDOException $e) {
            error_log('Redsys loadConfig: ' . $e->getMessage());
        }
        if (!$this->configured) {
            $this->merchantCode = getenv('REDSYS_MERCHANT_CODE') ?: '327234688';
            $this->terminal = getenv('REDSYS_TERMINAL') ?: '001';
            $this->secretKey = getenv('REDSYS_SECRET_KEY') ?: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
            $this->environment = (getenv('REDSYS_ENV') === 'production') ? 'production' : 'test';
            if ($this->merchantCode !== '' && $this->secretKey !== '') {
                $this->configured = true;
            }
        }
    }

    public function getRealizarPagoUrl(): string {
        return $this->environment === 'production' ? self::PROD_URL : self::TEST_URL;
    }

    private function getBaseUrl(): string {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'www.elektr-ame.com';
        return $protocol . '://' . $host;
    }

    public function generateOrderId(): string {
        $prefix = date('ymd');
        $suffix = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        return $prefix . $suffix;
    }

    private function formatAmount(float $amount): string {
        $cents = (int)round($amount * 100);
        return str_pad((string)$cents, 12, '0', STR_PAD_LEFT);
    }

    public function sign(string $merchantParametersBase64): string {
        $key = base64_decode($this->secretKey, true);
        if ($key === false || $key === '') {
            $key = $this->secretKey;
        }
        return base64_encode(hash_hmac('sha256', $merchantParametersBase64, $key, true));
    }

    public function verifySignature(string $merchantParametersBase64, string $signatureB64): bool {
        $expected = $this->sign($merchantParametersBase64);
        return hash_equals($expected, $signatureB64);
    }

    public function decodeParameters(string $merchantParametersBase64): ?array {
        $json = base64_decode($merchantParametersBase64, true);
        if ($json === false) {
            return null;
        }
        $data = json_decode($json, true);
        return is_array($data) ? $data : null;
    }

    /**
     * @return array{action: string, Ds_SignatureVersion: string, Ds_MerchantParameters: string, Ds_Signature: string, order_id: string}
     */
    public function createMembershipCheckout(
        int $memberId,
        string $membershipType,
        float $amount,
        string $currency,
        ?array $companyForTax = null
    ): array {
        if (!$this->configured) {
            throw new Exception('RedSys is not configured. Add merchant credentials in Admin → Payment or set REDSYS_* env vars.');
        }

        $orderId = $this->generateOrderId();
        $base = $this->getBaseUrl();
        $notifyUrl = $base . '/api/payment/redsys-notification.php';
        $urlOk = $base . '/payment-success?gateway=redsys&order_id=' . rawurlencode($orderId);
        $urlKo = $base . '/payment-cancelled?gateway=redsys';

        $params = [
            'Ds_Merchant_Amount' => $this->formatAmount($amount),
            'Ds_Merchant_Order' => $orderId,
            'Ds_Merchant_MerchantCode' => $this->merchantCode,
            'Ds_Merchant_Currency' => $currency === 'EUR' ? '978' : '978',
            'Ds_Merchant_TransactionType' => '0',
            'Ds_Merchant_Terminal' => $this->terminal,
            'Ds_Merchant_MerchantURL' => $notifyUrl,
            'Ds_Merchant_UrlOK' => $urlOk,
            'Ds_Merchant_UrlKO' => $urlKo,
            'Ds_Merchant_ConsumerLanguage' => '002',
            'Ds_Merchant_ProductDescription' => 'Elektr-Âme membership',
        ];

        $merchantData = [
            'member_id' => $memberId,
            'membership_type' => $membershipType,
            'start' => date('Y-m-d'),
            'end' => ($membershipType === 'lifetime') ? '' : date('Y-m-d', strtotime('+1 year')),
        ];
        if ($companyForTax && !empty($companyForTax['company_name'])) {
            $merchantData['tax_company'] = $companyForTax['company_name'];
            $merchantData['tax_cif'] = $companyForTax['company_cif'] ?? '';
            if (!empty($companyForTax['company_address'])) {
                $merchantData['tax_address'] = $companyForTax['company_address'];
            }
        }
        $params['Ds_Merchant_MerchantData'] = base64_encode(json_encode($merchantData));

        $json = json_encode($params, JSON_UNESCAPED_SLASHES);
        $merchantParameters = base64_encode($json);
        $signature = $this->sign($merchantParameters);

        $startDate = date('Y-m-d');
        $endDate = ($membershipType === 'lifetime') ? null : date('Y-m-d', strtotime('+1 year'));

        $this->storePendingTransaction(
            $memberId,
            $orderId,
            $amount,
            $currency,
            $membershipType,
            $startDate,
            $endDate,
            $merchantParameters
        );

        return [
            'action' => $this->getRealizarPagoUrl(),
            'Ds_SignatureVersion' => 'HMAC_SHA256_V1',
            'Ds_MerchantParameters' => $merchantParameters,
            'Ds_Signature' => $signature,
            'order_id' => $orderId,
        ];
    }

    private function storePendingTransaction(
        int $memberId,
        string $orderId,
        float $amount,
        string $currency,
        string $membershipType,
        string $startDate,
        ?string $endDate,
        string $gatewayPayload
    ): void {
        $stmt = $this->db->prepare("
            INSERT INTO payment_transactions (
                member_id, transaction_id, payment_gateway, amount, currency,
                status, membership_type, membership_start_date, membership_end_date,
                gateway_response
            ) VALUES (?, ?, 'redsys', ?, ?, 'pending', ?, ?, ?, ?)
        ");
        $stmt->execute([
            $memberId,
            $orderId,
            $amount,
            $currency,
            $membershipType,
            $startDate,
            $endDate,
            $gatewayPayload,
        ]);
    }

    public function processNotification(array $post): array {
        $merchantParameters = $post['Ds_MerchantParameters'] ?? '';
        $signature = $post['Ds_Signature'] ?? '';
        if ($merchantParameters === '' || $signature === '') {
            throw new Exception('Missing RedSys parameters');
        }
        if (!$this->verifySignature($merchantParameters, $signature)) {
            throw new Exception('Invalid RedSys signature');
        }
        $decoded = $this->decodeParameters($merchantParameters);
        if (!$decoded) {
            throw new Exception('Invalid RedSys payload');
        }

        $responseCode = $decoded['Ds_Response'] ?? '';
        $orderId = $decoded['Ds_Order'] ?? '';
        if ($orderId === '') {
            throw new Exception('Missing order in notification');
        }

        $authorized = ($responseCode === '0000');
        $stmt = $this->db->prepare("
            SELECT id, member_id, amount, membership_type, membership_start_date, membership_end_date, status
            FROM payment_transactions
            WHERE transaction_id = ? AND payment_gateway = 'redsys'
            LIMIT 1
        ");
        $stmt->execute([$orderId]);
        $tx = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$tx) {
            throw new Exception('Transaction not found for order ' . $orderId);
        }

        if ($tx['status'] === 'completed') {
            return [
                'success' => true,
                'order_id' => $orderId,
                'member_id' => (int)$tx['member_id'],
                'amount' => (float)$tx['amount'],
                'membership_type' => $tx['membership_type'],
                'membership_start_date' => $tx['membership_start_date'],
                'membership_end_date' => $tx['membership_end_date'],
                'response_code' => $responseCode,
                'already_processed' => true,
            ];
        }

        $update = $this->db->prepare("
            UPDATE payment_transactions
            SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $status = $authorized ? 'completed' : 'failed';
        $update->execute([
            $status,
            json_encode($decoded),
            $tx['id'],
        ]);

        return [
            'success' => $authorized,
            'order_id' => $orderId,
            'member_id' => (int)$tx['member_id'],
            'amount' => (float)$tx['amount'],
            'membership_type' => $tx['membership_type'],
            'membership_start_date' => $tx['membership_start_date'],
            'membership_end_date' => $tx['membership_end_date'],
            'response_code' => $responseCode,
            'already_processed' => false,
        ];
    }

    public function getCompletedTransactionByOrder(string $orderId): ?array {
        $stmt = $this->db->prepare("
            SELECT member_id, amount, membership_type, membership_start_date, membership_end_date, status
            FROM payment_transactions
            WHERE transaction_id = ? AND payment_gateway = 'redsys' AND status = 'completed'
            LIMIT 1
        ");
        $stmt->execute([$orderId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
}
