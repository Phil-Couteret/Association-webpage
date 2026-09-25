<?php
/**
 * Stripe Payment Handler
 * Handles all Stripe API interactions for payment processing
 *
 * API Version: 2026-01-28.clover (pinned for consistent behavior)
 */

class StripePayment {
    private const STRIPE_API_VERSION = '2026-01-28.clover';

    private $db;
    private $secretKey;
    private $publicKey;
    private $webhookSecret;
    
    public function __construct($database) {
        $this->db = $database;
        $this->loadStripeConfig();
    }
    
    /**
     * Load Stripe configuration from database
     */
    private function loadStripeConfig() {
        try {
            // Check if table exists first
            $tableCheck = $this->db->query("SHOW TABLES LIKE 'payment_config'");
            if ($tableCheck->rowCount() === 0) {
                throw new Exception("Payment configuration table does not exist. Please run database setup first.");
            }
            
            $stmt = $this->db->prepare("
                SELECT api_key_public, api_key_secret, webhook_secret 
                FROM payment_config 
                WHERE gateway = 'stripe' AND is_active = 1
                LIMIT 1
            ");
            $stmt->execute();
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($config && !empty($config['api_key_secret'])) {
                $this->publicKey = $config['api_key_public'];
                $this->secretKey = $config['api_key_secret'];
                $this->webhookSecret = $config['webhook_secret'];
            } else {
                throw new Exception("Stripe configuration not found or inactive. Please configure Stripe in Admin Portal.");
            }
        } catch (PDOException $e) {
            error_log("Stripe config load PDO error: " . $e->getMessage());
            throw new Exception("Database error loading Stripe configuration: " . $e->getMessage());
        } catch (Exception $e) {
            error_log("Stripe config load error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Make API request to Stripe
     */
    private function makeRequest($endpoint, $method = 'GET', $data = null) {
        $ch = curl_init();
        
        $url = 'https://api.stripe.com/v1/' . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->secretKey,
            'Stripe-Version: ' . self::STRIPE_API_VERSION,
        ];
        
        if ($method === 'POST') {
            // Stripe API accepts both form-encoded and JSON
            // For checkout sessions with nested arrays, use form-encoded with proper formatting
            if ($data) {
                $headers[] = 'Content-Type: application/x-www-form-urlencoded';
                // Convert nested arrays to Stripe's expected format
                $postData = $this->formatStripeData($data);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            }
            curl_setopt($ch, CURLOPT_POST, true);
        } elseif ($method === 'GET' && $data) {
            $url .= '?' . http_build_query($data);
        }
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception("cURL error: " . $error);
        }
        
        $decoded = json_decode($response, true);
        
        if ($httpCode >= 400) {
            $errorMsg = $decoded['error']['message'] ?? 'Unknown error';
            throw new Exception("Stripe API error: " . $errorMsg);
        }
        
        return $decoded;
    }
    
    /**
     * Format data for Stripe API (handle nested arrays)
     */
    private function formatStripeData($data) {
        $result = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                // Handle nested arrays (e.g., line_items, metadata)
                foreach ($value as $index => $item) {
                    if (is_array($item)) {
                        foreach ($item as $subKey => $subValue) {
                            if (is_array($subValue)) {
                                // Handle deeply nested (e.g., price_data)
                                foreach ($subValue as $subSubKey => $subSubValue) {
                                    if (is_array($subSubValue)) {
                                        // Handle very nested (e.g., product_data)
                                        foreach ($subSubValue as $finalKey => $finalValue) {
                                            $result["{$key}[{$index}][{$subKey}][{$subSubKey}][{$finalKey}]"] = $finalValue;
                                        }
                                    } else {
                                        $result["{$key}[{$index}][{$subKey}][{$subSubKey}]"] = $subSubValue;
                                    }
                                }
                            } else {
                                $result["{$key}[{$index}][{$subKey}]"] = $subValue;
                            }
                        }
                    } else {
                        $result["{$key}[{$index}]"] = $item;
                    }
                }
            } else {
                $result[$key] = $value;
            }
        }
        
        return http_build_query($result);
    }
    
    /**
     * Create a Stripe Checkout Session
     */
    public function createCheckoutSession($memberId, $membershipType, $amount, $currency = 'EUR') {
        try {
            // Calculate membership dates
            $startDate = date('Y-m-d');
            $endDate = null;
            
            if ($membershipType === 'basic' || $membershipType === 'sponsor') {
                $endDate = date('Y-m-d', strtotime('+1 year'));
            } elseif ($membershipType === 'lifetime') {
                $endDate = null; // Lifetime has no end date
            }
            
            // Determine success and cancel URLs
            $baseUrl = $this->getBaseUrl();
            $successUrl = $baseUrl . '/payment-success?session_id={CHECKOUT_SESSION_ID}';
            $cancelUrl = $baseUrl . '/payment-cancelled';
            
            // Create line item
            $lineItems = [[
                'price_data' => [
                    'currency' => strtolower($currency),
                    'product_data' => [
                        'name' => ucfirst($membershipType) . ' Membership - Elektr-Âme',
                        'description' => $this->getMembershipDescription($membershipType),
                    ],
                    'unit_amount' => (int)($amount * 100), // Convert to cents
                ],
                'quantity' => 1,
            ]];
            
            // Create checkout session
            $sessionData = [
                'payment_method_types' => ['card'],
                'line_items' => $lineItems,
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => [
                    'member_id' => $memberId,
                    'membership_type' => $membershipType,
                    'membership_start_date' => $startDate,
                    'membership_end_date' => $endDate ?? '',
                ],
                'customer_email' => $this->getMemberEmail($memberId),
            ];
            
            // Use Stripe API to create session
            // Note: Stripe Checkout requires creating a session via API
            // We'll use a simplified approach with payment_intents for now
            // Or we can use Stripe's hosted checkout
            
            // For now, create a Payment Intent instead (simpler for our use case)
            return $this->createPaymentIntent($memberId, $membershipType, $amount, $currency, $startDate, $endDate);
            
        } catch (Exception $e) {
            error_log("Stripe checkout session error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Create a Payment Intent (alternative to Checkout Session)
     */
    public function createPaymentIntent($memberId, $membershipType, $amount, $currency = 'EUR', $startDate = null, $endDate = null) {
        try {
            $baseUrl = $this->getBaseUrl();
            
            $paymentIntentData = [
                'amount' => (int)($amount * 100), // Convert to cents
                'currency' => strtolower($currency),
                'metadata' => [
                    'member_id' => $memberId,
                    'membership_type' => $membershipType,
                    'membership_start_date' => $startDate ?? date('Y-m-d'),
                    'membership_end_date' => $endDate ?? '',
                ],
                'description' => ucfirst($membershipType) . ' Membership - Elektr-Âme',
            ];
            
            $response = $this->makeRequest('payment_intents', 'POST', $paymentIntentData);
            
            // Store transaction in database
            $this->storeTransaction(
                $memberId,
                $response['id'],
                $amount,
                $currency,
                'pending',
                $membershipType,
                $startDate,
                $endDate,
                json_encode($response)
            );
            
            return [
                'client_secret' => $response['client_secret'],
                'payment_intent_id' => $response['id'],
                'amount' => $amount,
                'currency' => $currency,
            ];
            
        } catch (Exception $e) {
            error_log("Stripe payment intent error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Create a Checkout Session (Stripe's hosted checkout page)
     * @param array|null $companyForTax Optional: ['company_name','company_cif','company_address'] for tax receipt to company
     */
    public function createCheckoutSessionHosted($memberId, $membershipType, $amount, $currency = 'EUR', $companyForTax = null) {
        try {
            $startDate = date('Y-m-d');
            $endDate = ($membershipType === 'lifetime') ? null : date('Y-m-d', strtotime('+1 year'));
            
            $baseUrl = $this->getBaseUrl();
            $successUrl = $baseUrl . '/payment-success?session_id={CHECKOUT_SESSION_ID}';
            $cancelUrl = $baseUrl . '/payment-cancelled';
            
            $metadata = [
                'member_id' => (string)$memberId,
                'membership_type' => $membershipType,
                'membership_start_date' => $startDate,
                'membership_end_date' => $endDate ?? '',
            ];
            if ($companyForTax && !empty($companyForTax['company_name']) && !empty($companyForTax['company_cif'])) {
                $metadata['tax_fiscal_recipient'] = 'company';
                $metadata['company_name'] = $companyForTax['company_name'];
                $metadata['company_cif'] = $companyForTax['company_cif'];
                $metadata['company_address'] = $companyForTax['company_address'] ?? '';
            }
            
            // Build session data - omit payment_method_types for dynamic methods
            $sessionData = [
                'line_items' => [[
                    'price_data' => [
                        'currency' => strtolower($currency),
                        'unit_amount' => (int)($amount * 100),
                        'product_data' => [
                            'name' => ucfirst($membershipType) . ' Membership',
                            'description' => $this->getMembershipDescription($membershipType),
                        ],
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'metadata' => $metadata,
            ];
            
            $customerEmail = $this->getMemberEmail($memberId);
            if ($customerEmail) {
                $sessionData['customer_email'] = $customerEmail;
            }
            
            $response = $this->makeRequest('checkout/sessions', 'POST', $sessionData);
            $paymentIntentId = $response['payment_intent'] ?? null;

            // Store transaction (include payment_intent_id for refund webhook lookup)
            $this->storeTransaction(
                $memberId,
                $response['id'],
                $amount,
                $currency,
                'pending',
                $membershipType,
                $startDate,
                $endDate,
                json_encode($response),
                $paymentIntentId
            );
            
            return [
                'session_id' => $response['id'],
                'url' => $response['url'],
                'amount' => $amount,
                'currency' => $currency,
            ];
            
        } catch (Exception $e) {
            error_log("Stripe checkout session error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Create checkout session for sponsor donation (company, no member)
     */
    public function createSponsorCheckoutSession($sponsorId, $companyName, $companyCif, $companyAddress, $contactEmail, $amount, $currency = 'EUR') {
        $baseUrl = $this->getBaseUrl();
        $successUrl = $baseUrl . '/sponsor-success?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = $baseUrl . '/sponsor';

        $sessionData = [
            'line_items' => [[
                'price_data' => [
                    'currency' => strtolower($currency),
                    'unit_amount' => (int)($amount * 100),
                    'product_data' => [
                        'name' => 'Sponsor Donation - Elektr-Âme',
                        'description' => 'Company sponsorship / donation to Elektr-Âme association',
                    ],
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'customer_email' => $contactEmail,
            'metadata' => [
                'sponsor_donation_id' => (string)$sponsorId,
                'company_name' => $companyName,
                'company_cif' => $companyCif,
                'company_address' => $companyAddress ?? '',
            ],
        ];

        $response = $this->makeRequest('checkout/sessions', 'POST', $sessionData);

        // Update sponsor_donations with transaction_id
        $updateStmt = $this->db->prepare("UPDATE sponsor_donations SET transaction_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $updateStmt->execute([$response['id'], $sponsorId]);

        return [
            'session_id' => $response['id'],
            'url' => $response['url'],
            'amount' => $amount,
            'currency' => $currency,
        ];
    }

    /**
     * Retrieve a Checkout Session
     */
    public function getCheckoutSession($sessionId) {
        try {
            return $this->makeRequest('checkout/sessions/' . $sessionId);
        } catch (Exception $e) {
            error_log("Stripe get session error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Retrieve a Payment Intent
     */
    public function getPaymentIntent($paymentIntentId) {
        try {
            return $this->makeRequest('payment_intents/' . $paymentIntentId);
        } catch (Exception $e) {
            error_log("Stripe get payment intent error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Verify webhook signature
     */
    public function verifyWebhookSignature($payload, $signature) {
        if (!$this->webhookSecret) {
            throw new Exception("Webhook secret not configured");
        }
        
        // Stripe webhook signature verification
        // Format: timestamp,signature1 signature2
        $elements = explode(',', $signature);
        $timestamp = null;
        $signatures = [];
        
        foreach ($elements as $element) {
            if (strpos($element, '=') !== false) {
                list($key, $value) = explode('=', $element, 2);
                if ($key === 't') {
                    $timestamp = $value;
                } elseif ($key === 'v1') {
                    $signatures[] = $value;
                }
            }
        }
        
        // Verify timestamp (should be within 5 minutes)
        if ($timestamp && abs(time() - $timestamp) > 300) {
            throw new Exception("Webhook timestamp too old");
        }
        
        // Compute expected signature
        $signedPayload = $timestamp . '.' . $payload;
        $expectedSignature = hash_hmac('sha256', $signedPayload, $this->webhookSecret);
        
        // Compare signatures
        foreach ($signatures as $signature) {
            if (hash_equals($expectedSignature, $signature)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Store transaction in database
     * @param string|null $paymentIntentId Optional - for refund webhook lookup (charge.refunded uses pi_xxx)
     */
    private function storeTransaction($memberId, $transactionId, $amount, $currency, $status, $membershipType, $startDate, $endDate, $gatewayResponse, $paymentIntentId = null) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO payment_transactions (
                    member_id, transaction_id, payment_intent_id, payment_gateway, amount, currency,
                    status, membership_type, membership_start_date, membership_end_date,
                    gateway_response
                ) VALUES (?, ?, ?, 'stripe', ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $memberId,
                $transactionId,
                $paymentIntentId,
                $amount,
                $currency,
                $status,
                $membershipType,
                $startDate,
                $endDate,
                $gatewayResponse
            ]);
            
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            if ($paymentIntentId !== null && strpos($e->getMessage(), 'payment_intent_id') !== false) {
                // Fallback for DBs without migration - insert without payment_intent_id
                $stmt = $this->db->prepare("
                    INSERT INTO payment_transactions (
                        member_id, transaction_id, payment_gateway, amount, currency,
                        status, membership_type, membership_start_date, membership_end_date,
                        gateway_response
                    ) VALUES (?, ?, 'stripe', ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $memberId, $transactionId, $amount, $currency, $status,
                    $membershipType, $startDate, $endDate, $gatewayResponse
                ]);
                return $this->db->lastInsertId();
            }
            error_log("Store transaction error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Update transaction status by transaction_id (session_id or payment_intent_id)
     */
    public function updateTransactionStatus($transactionId, $status, $errorMessage = null, $gatewayResponse = null) {
        try {
            $stmt = $this->db->prepare("
                UPDATE payment_transactions 
                SET status = ?, 
                    error_message = ?,
                    gateway_response = COALESCE(?, gateway_response),
                    updated_at = CURRENT_TIMESTAMP
                WHERE transaction_id = ?
            ");
            
            $stmt->execute([$status, $errorMessage, $gatewayResponse, $transactionId]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Update transaction error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update transaction status by payment_intent_id (for charge.refunded webhook)
     * Checkout Sessions store session_id; charge.refunded provides payment_intent
     */
    public function updateTransactionStatusByPaymentIntent($paymentIntentId, $status, $errorMessage = null, $gatewayResponse = null) {
        try {
            $stmt = $this->db->prepare("
                UPDATE payment_transactions 
                SET status = ?, 
                    error_message = ?,
                    gateway_response = COALESCE(?, gateway_response),
                    updated_at = CURRENT_TIMESTAMP
                WHERE payment_intent_id = ?
            ");
            
            $stmt->execute([$status, $errorMessage, $gatewayResponse, $paymentIntentId]);
            
            if ($stmt->rowCount() > 0) {
                return true;
            }
            // Fallback: for PaymentIntent flow, transaction_id IS the payment_intent_id
            return $this->updateTransactionStatus($paymentIntentId, $status, $errorMessage, $gatewayResponse);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'payment_intent_id') !== false) {
                return $this->updateTransactionStatus($paymentIntentId, $status, $errorMessage, $gatewayResponse);
            }
            error_log("Update transaction by payment_intent error: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get member email
     */
    private function getMemberEmail($memberId) {
        $stmt = $this->db->prepare("SELECT email FROM members WHERE id = ?");
        $stmt->execute([$memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);
        return $member ? $member['email'] : null;
    }
    
    /**
     * Get base URL
     */
    private function getBaseUrl() {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'www.elektr-ame.com';
        return $protocol . '://' . $host;
    }
    
    /**
     * Get membership description
     */
    private function getMembershipDescription($membershipType) {
        $descriptions = [
            'basic' => 'Basic membership - Full access to Elektr-Âme community',
            'sponsor' => 'Sponsor membership - Support the community with tax benefits',
            'lifetime' => 'Lifetime membership - Permanent access to Elektr-Âme',
        ];
        
        return $descriptions[$membershipType] ?? 'Elektr-Âme membership';
    }
    
    /**
     * Get public key (for frontend)
     */
    public function getPublicKey() {
        return $this->publicKey;
    }
}

