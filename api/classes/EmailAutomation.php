<?php
/**
 * Email Automation System
 * Handles automated email sending with templates and variable replacement
 */

class EmailAutomation {
    private $db;
    private $taxCalculator;

    public function __construct($database) {
        $this->db = $database;
        require_once __DIR__ . '/TaxCalculator.php';
        $this->taxCalculator = new TaxCalculator();
    }

    /**
     * Queue an email for sending
     */
    public function queueEmail($recipientEmail, $recipientName, $templateKey, $variables = [], $memberId = null, $priority = 'normal', $scheduledFor = null) {
        try {
            // Get template
            $stmt = $this->db->prepare("
                SELECT * FROM email_templates 
                WHERE template_key = :key AND active = 1
            ");
            $stmt->execute([':key' => $templateKey]);
            $template = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$template) {
                throw new Exception("Template not found: $templateKey");
            }

            // Determine member's preferred language (default to EN)
            $lang = $this->getMemberLanguage($memberId);

            // Get subject and body in correct language
            $subject = $this->replaceVariables($template["subject_$lang"], $variables);
            $body = $this->replaceVariables($template["body_$lang"], $variables);

            // Insert into queue
            $stmt = $this->db->prepare("
                INSERT INTO email_queue 
                (recipient_email, recipient_name, subject, body, template_key, member_id, priority, scheduled_for, status)
                VALUES 
                (:email, :name, :subject, :body, :template_key, :member_id, :priority, :scheduled_for, 'pending')
            ");

            $stmt->execute([
                ':email' => $recipientEmail,
                ':name' => $recipientName,
                ':subject' => $subject,
                ':body' => $body,
                ':template_key' => $templateKey,
                ':member_id' => $memberId,
                ':priority' => $priority,
                ':scheduled_for' => $scheduledFor
            ]);

            return true;
        } catch (Exception $e) {
            error_log("Email queue error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send queued emails
     */
    public function processQueue($limit = 50) {
        try {
            // Get pending emails ordered by priority and scheduled time
            $stmt = $this->db->prepare("
                SELECT * FROM email_queue 
                WHERE status = 'pending' 
                AND (scheduled_for IS NULL OR scheduled_for <= NOW())
                ORDER BY 
                    CASE priority 
                        WHEN 'high' THEN 1 
                        WHEN 'normal' THEN 2 
                        WHEN 'low' THEN 3 
                    END,
                    created_at ASC
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $emails = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $sent = 0;
            $failed = 0;

            foreach ($emails as $email) {
                // Mark as processing
                $this->updateQueueStatus($email['id'], 'processing');

                // Send email
                $result = $this->sendEmail(
                    $email['recipient_email'],
                    $email['recipient_name'],
                    $email['subject'],
                    $email['body']
                );

                if ($result) {
                    // Mark as sent
                    $this->updateQueueStatus($email['id'], 'sent');
                    $this->logEmail($email['member_id'], $email['recipient_email'], $email['template_key'], $email['subject'], 'sent');
                    $sent++;
                } else {
                    // Increment retry count
                    $retryCount = $email['retry_count'] + 1;
                    
                    if ($retryCount >= $email['max_retries']) {
                        // Max retries reached, mark as failed
                        $this->updateQueueStatus($email['id'], 'failed', 'Max retries reached');
                        $this->logEmail($email['member_id'], $email['recipient_email'], $email['template_key'], $email['subject'], 'failed', 'Max retries reached');
                        $failed++;
                    } else {
                        // Schedule for retry (exponential backoff)
                        $retryDelay = pow(2, $retryCount) * 60; // 2^n minutes
                        $scheduledFor = date('Y-m-d H:i:s', time() + $retryDelay);
                        
                        $stmt = $this->db->prepare("
                            UPDATE email_queue 
                            SET status = 'pending', retry_count = :retry, scheduled_for = :scheduled
                            WHERE id = :id
                        ");
                        $stmt->execute([
                            ':retry' => $retryCount,
                            ':scheduled' => $scheduledFor,
                            ':id' => $email['id']
                        ]);
                    }
                }
            }

            return ['sent' => $sent, 'failed' => $failed, 'total' => count($emails)];
        } catch (Exception $e) {
            error_log("Email processing error: " . $e->getMessage());
            return ['sent' => 0, 'failed' => 0, 'total' => 0, 'error' => $e->getMessage()];
        }
    }

    /**
     * Trigger automated emails based on events
     */
    public function triggerAutomation($triggerType, $memberId) {
        try {
            // Get member data
            $member = $this->getMemberData($memberId);
            if (!$member) {
                throw new Exception("Member not found");
            }

            // Get automation rules for this trigger
            $stmt = $this->db->prepare("
                SELECT ear.*, et.template_key
                FROM email_automation_rules ear
                JOIN email_templates et ON ear.template_id = et.id
                WHERE ear.trigger_type = :trigger AND ear.active = 1
            ");
            $stmt->execute([':trigger' => $triggerType]);
            $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rules as $rule) {
                // Prepare variables for template
                $variables = $this->prepareTemplateVariables($member, $triggerType);

                // Calculate scheduled time based on offset
                $scheduledFor = null;
                if ($rule['days_offset'] != 0) {
                    $scheduledFor = date('Y-m-d H:i:s', strtotime("+{$rule['days_offset']} days"));
                }

                // Queue the email
                $this->queueEmail(
                    $member['email'],
                    $this->memberDisplayName($member),
                    $rule['template_key'],
                    $variables,
                    $memberId,
                    'normal',
                    $scheduledFor
                );
            }

            // Databases that never got automation rules still have templates: queue by template_key
            if (count($rules) === 0 && in_array($triggerType, ['member_approved', 'member_rejected'], true)) {
                $variables = $this->prepareTemplateVariables($member, $triggerType);
                $queued = $this->queueEmail(
                    $member['email'],
                    $this->memberDisplayName($member),
                    $triggerType,
                    $variables,
                    $memberId,
                    'high',
                    null
                );
                if (!$queued) {
                    error_log("triggerAutomation: no rule and direct queue failed for $triggerType member_id=$memberId (add active template in admin or run database/ensure-member-status-email-automation.sql)");
                }
            }

            return true;
        } catch (Exception $e) {
            error_log("Automation trigger error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Queue and send a membership status template (admin "resend" action).
     * @param int $memberId
     * @param string $templateKey member_approved | member_rejected
     * @return array{ok: bool, message: string}
     */
    public function resendMemberStatusEmail($memberId, $templateKey) {
        if (!in_array($templateKey, ['member_approved', 'member_rejected'], true)) {
            return ['ok' => false, 'message' => 'Invalid template'];
        }
        $member = $this->getMemberData($memberId);
        if (!$member) {
            return ['ok' => false, 'message' => 'Member not found'];
        }
        if ($templateKey === 'member_approved' && ($member['status'] ?? '') !== 'approved') {
            return ['ok' => false, 'message' => 'Member must be approved to resend this email'];
        }
        if ($templateKey === 'member_rejected' && ($member['status'] ?? '') !== 'rejected') {
            return ['ok' => false, 'message' => 'Member must be rejected to resend this email'];
        }
        $variables = $this->prepareTemplateVariables($member, $templateKey);
        $queued = $this->queueEmail(
            $member['email'],
            $this->memberDisplayName($member),
            $templateKey,
            $variables,
            (int) $memberId,
            'high',
            null
        );
        if (!$queued) {
            return ['ok' => false, 'message' => 'Could not queue email. Check that the template exists and is active.'];
        }
        $this->processQueue(10);
        return ['ok' => true, 'message' => 'Email sent'];
    }

    /**
     * Send payment confirmation + tax receipt when admin records a manual payment
     * (cash, wire transfer, etc.)
     */
    public function sendPaymentRecordedEmails($memberId) {
        try {
            $member = $this->getMemberDataForEmails($memberId);
            if (!$member || floatval($member['payment_amount'] ?? 0) <= 0) {
                return false;
            }
            $recipientName = $member['first_name'] . ' ' . ($member['last_name'] ?? $member['second_name'] ?? '');
            $variables = $this->prepareTemplateVariables($member, 'payment_recorded');

            // Payment confirmation (always)
            $this->queueEmail(
                $member['email'],
                $recipientName,
                'payment_confirmation',
                [
                    'first_name' => $member['first_name'],
                    'amount' => number_format($member['payment_amount'], 2),
                    'membership_type' => ucfirst($member['membership_type'] ?? 'Basic'),
                    'date' => date('Y-m-d'),
                ],
                $memberId,
                'high'
            );

            // Tax receipt PDF for Spain residents only (IRPF applies in Spain)
            if (floatval($member['payment_amount'] ?? 0) >= 20 && $this->isSpainResident($member['country'] ?? '')) {
                $this->sendTaxReceiptPdf($memberId, $variables);
            }

            $this->processQueue(10);
            return true;
        } catch (Exception $e) {
            error_log("Payment recorded emails error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get member data for emails (alias for getMemberData - can be made public)
     */
    private function getMemberDataForEmails($memberId) {
        return $this->getMemberData($memberId);
    }

    /**
     * Build template variables for tax receipt (used by confirm-payment and sendPaymentRecordedEmails)
     * @param array $member Member data
     * @param array|null $companyOverride When tax receipt is for company: ['company_name','company_cif','company_address']
     */
    public function preparePaymentTaxVariables($member, $companyOverride = null) {
        $variables = $this->prepareTemplateVariables($member, 'payment_recorded');
        if ($companyOverride && !empty($companyOverride['company_name']) && !empty($companyOverride['company_cif'])) {
            $variables['full_name'] = $companyOverride['company_name'];
            $variables['email'] = $member['email']; // Still send to member email
            $variables['company_cif'] = $companyOverride['company_cif'];
            $variables['company_address'] = $companyOverride['company_address'] ?? '';
            $variables['tax_type'] = 'company'; // For Impuesto de Sociedades
        }
        return $variables;
    }

    /**
     * Check for expiring memberships and send reminders
     */
    public function checkExpiringMemberships() {
        try {
            $results = ['7d' => 0, '3d' => 0, '1d' => 0];

            // Check for memberships expiring in 7, 3, and 1 day(s)
            $periods = [
                ['days' => 7, 'trigger' => 'membership_expiring_7d'],
                ['days' => 3, 'trigger' => 'membership_expiring_3d'],
                ['days' => 1, 'trigger' => 'membership_expiring_1d']
            ];

            foreach ($periods as $period) {
                $stmt = $this->db->prepare("
                SELECT m.* 
                FROM members m
                WHERE m.status = 'approved'
                AND m.membership_type = 'yearly'
                AND DATE(m.membership_end_date) = DATE(NOW() + INTERVAL :days DAY)
                    AND NOT EXISTS (
                        SELECT 1 FROM email_logs el
                        WHERE el.member_id = m.id
                        AND el.template_key = :template_key
                        AND DATE(el.sent_at) = CURDATE()
                    )
                ");
                
                $templateKey = $period['trigger'];
                $stmt->execute([
                    ':days' => $period['days'],
                    ':template_key' => $templateKey
                ]);
                
                $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($members as $member) {
                    $variables = $this->prepareTemplateVariables($member, $period['trigger']);
                    
                    $this->queueEmail(
                        $member['email'],
                        $member['first_name'] . ' ' . $member['second_name'],
                        $templateKey,
                        $variables,
                        $member['id'],
                        'high'
                    );
                    
                    $results[$period['days'] . 'd']++;
                }
            }

            return $results;
        } catch (Exception $e) {
            error_log("Expiring memberships check error: " . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Prepare template variables based on member data and trigger
     */
    private function prepareTemplateVariables($member, $triggerType) {
        $lastName = $member['last_name'] ?? $member['second_name'] ?? '';
        $variables = [
            'first_name' => $member['first_name'],
            'full_name' => $member['first_name'] . ' ' . $lastName,
            'email' => $member['email'],
            'membership_type' => ucfirst($member['membership_type']),
            'end_date' => $member['membership_end_date'] ? date('F j, Y', strtotime($member['membership_end_date'])) : 'N/A',
            'amount' => $member['payment_amount'] ?? '0.00',
            'date' => date('F j, Y'),
            'receipt_id' => 'EA-' . date('Y') . '-' . str_pad($member['id'], 6, '0', STR_PAD_LEFT)
        ];

        // Add tax deduction info for any payment >= €20 (Spanish tax law: 80% on first €250)
        $paymentAmount = floatval($member['payment_amount'] ?? 0);
        if ($paymentAmount >= 20) {
            $taxCalc = $this->taxCalculator->calculate($paymentAmount);
            $variables['tax_deduction'] = number_format($taxCalc['deduction'], 2);
            $variables['net_cost'] = number_format($taxCalc['netCost'], 2);
            $variables['discount_percent'] = number_format($taxCalc['effectiveDiscount'], 1);
            
            // Calculate deduction above €250 for detailed breakdown
            $first250Amount = min($paymentAmount, 250);
            $variables['tax_deduction_first_250'] = number_format($first250Amount * 0.80, 2);
            $above250Amount = max(0, $paymentAmount - 250);
            $above250Deduction = $above250Amount * ($taxCalc['recurringBonus'] ? 0.45 : 0.40);
            $variables['tax_deduction_above_250'] = number_format($above250Deduction, 2);
            
            $variables['tax_deduction_info'] = "You can deduct €{$variables['tax_deduction']} from your taxes (80% on first €250, 40% above).";
            
            if ($taxCalc['recurringBonus']) {
                $variables['recurring_bonus_info'] = "⭐ RECURRING DONOR BONUS: You qualify for 45% deduction on amounts above €250 (3+ consecutive years).";
            } else {
                $variables['recurring_bonus_info'] = "";
            }
            
            $variables['tax_receipt_info'] = "A separate tax receipt email has been sent for your records.";
        } else {
            $variables['tax_deduction_info'] = '';
            $variables['tax_receipt_info'] = '';
            $variables['recurring_bonus_info'] = '';
            $variables['tax_deduction_above_250'] = '0.00';
        }

        return $variables;
    }

    /**
     * Replace variables in template text
     */
    private function replaceVariables($text, $variables) {
        foreach ($variables as $key => $value) {
            $text = str_replace('{{' . $key . '}}', $value, $text);
        }
        
        // Remove any unreplaced variables
        $text = preg_replace('/\{\{[^}]+\}\}/', '', $text);
        
        return $text;
    }

    /**
     * Send email via SMTP (or mail() fallback if SMTP not configured)
     */
    private function sendEmail($to, $toName, $subject, $body) {
        require_once __DIR__ . '/Mailer.php';
        $fullBody = $body . "\n\n---\nElektr-Âme - Electronic Music Community\nhttps://www.elektr-ame.com";
        return Mailer::send($to, $subject, $fullBody, ['toName' => $toName]);
    }

    /**
     * Check if member is Spain resident (for tax receipt - IRPF only applies in Spain)
     */
    public function isSpainResident($country) {
        if (empty($country)) return false;
        $c = strtolower(trim($country));
        $spainPatterns = ['spain', 'españa', 'espana', 'españa', 'catalonia', 'catalunya', 'cataluña', 'es '];
        foreach ($spainPatterns as $p) {
            if (strpos($c, $p) !== false) return true;
        }
        if ($c === 'es' || $c === 'esp') return true;
        return false;
    }

    /**
     * Store PDF for secure download and return the download URL
     * Token expires in 30 days
     */
    private function storeTaxReceiptForDownload($memberId, $pdfContent, $receiptId) {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        $stmt = $this->db->prepare("
            INSERT INTO tax_receipt_downloads (token, member_id, pdf_content, receipt_id, expires_at)
            VALUES (:token, :member_id, :pdf_content, :receipt_id, :expires_at)
        ");
        $stmt->execute([
            ':token' => $token,
            ':member_id' => $memberId,
            ':pdf_content' => $pdfContent,
            ':receipt_id' => $receiptId,
            ':expires_at' => $expiresAt
        ]);
        $baseUrl = function_exists('getBaseUrl') ? getBaseUrl() : 'https://www.elektr-ame.com';
        return $baseUrl . '/api/download-tax-receipt.php?token=' . $token;
    }

    /**
     * Send email with PDF attachment (for tax receipt) - kept for reference, not used
     */
    public function sendEmailWithPdfAttachment($to, $toName, $subject, $body, $pdfContent, $attachmentFilename = 'tax-receipt.pdf') {
        if (empty($pdfContent) || substr($pdfContent, 0, 4) !== '%PDF') {
            error_log("Tax receipt PDF: invalid or empty PDF content");
            return false;
        }
        $boundary = '----=_Part_' . md5(uniqid(mt_rand(), true));
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers = [
            'From: Elektr-Ame <noreply@elektr-ame.com>',
            'Reply-To: contact@elektr-ame.com',
            'Date: ' . date('r'),
            'Message-ID: <' . md5(uniqid(mt_rand(), true)) . '@elektr-ame.com>',
            'X-Mailer: PHP/' . phpversion(),
            'MIME-Version: 1.0',
            'Content-Type: multipart/mixed; boundary="' . $boundary . '"'
        ];
        $message = "This is a multi-part message in MIME format.\r\n\r\n";
        $message .= "--$boundary\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode($body)) . "\r\n";
        $message .= "--$boundary\r\n";
        $message .= "Content-Type: application/pdf; name=\"" . $attachmentFilename . "\"\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n";
        $message .= "Content-Disposition: attachment; filename=\"" . $attachmentFilename . "\"\r\n\r\n";
        $message .= chunk_split(base64_encode($pdfContent));
        $message .= "\r\n--$boundary--\r\n";
        $result = mail($to, $encodedSubject, $message, implode("\r\n", $headers));
        if (!$result) {
            error_log("Tax receipt PDF email failed to send to: $to");
        }
        return $result;
    }

    /**
     * Send tax receipt as PDF download link (Spain residents only)
     * Uses secure link instead of attachment - plain emails deliver reliably on OVH
     * Returns true if sent, false if skipped (non-Spain) or failed
     */
    public function sendTaxReceiptPdf($memberId, $variables) {
        require_once __DIR__ . '/../tax-features.php';
        if (!tax_receipt_actions_enabled()) {
            return false;
        }
        $member = $this->getMemberData($memberId);
        if (!$member) return false;
        if (!$this->isSpainResident($member['country'] ?? '')) return false;
        if (floatval($member['payment_amount'] ?? $variables['amount'] ?? 0) < 20) return false;

        try {
            // Include payment_method for PDF (stripe, wire_transfer, cash, etc.)
            $variables['payment_method'] = $member['payment_method'] ?? 'stripe';
            require_once __DIR__ . '/TaxReceiptPdf.php';
            $pdf = new TaxReceiptPdf($variables);
            $pdfContent = $pdf->generate();
            $receiptId = $variables['receipt_id'] ?? 'EA-' . date('Y') . '-' . str_pad($memberId, 6, '0', STR_PAD_LEFT);

            // Store PDF for download, get secure link (avoids attachment delivery issues)
            $downloadUrl = $this->storeTaxReceiptForDownload($memberId, $pdfContent, $receiptId);

            $subject = 'Your tax deduction certificate - Elektr-Âme';
            $lang = $this->getMemberLanguage($memberId);
            if ($lang === 'es') $subject = 'Tu certificado de deducción fiscal - Elektr-Âme';
            elseif ($lang === 'ca') $subject = 'El teu certificat de deducció fiscal - Elektr-Âme';

            $firstName = $variables['first_name'] ?? '';
            $body = "Dear $firstName,\n\nYour official tax deduction certificate for your donation to Elektr-Âme is ready.\n\nDownload your PDF here (link valid 30 days):\n$downloadUrl\n\nYou can use this PDF when filing your IRPF declaration with the Spanish tax authority (Hacienda).\n\nBest regards,\nThe Elektr-Âme Team";
            if ($lang === 'es') $body = "Estimado/a $firstName,\n\nSu certificado oficial de deducción fiscal por su donación a Elektr-Âme está listo.\n\nDescargue su PDF aquí (enlace válido 30 días):\n$downloadUrl\n\nPuede utilizar este PDF al presentar su declaración de IRPF ante la Agencia Tributaria.\n\nSaludos,\nEl equipo de Elektr-Âme";
            elseif ($lang === 'ca') $body = "Benvolgut/da $firstName,\n\nEl seu certificat oficial de deducció fiscal per la seva donació a Elektr-Âme està llest.\n\nDescarregueu el PDF aquí (enllaç vàlid 30 dies):\n$downloadUrl\n\nPodeu utilitzar aquest PDF en presentar la declaració d'IRPF.\n\nSalutacions,\nL'equip d'Elektr-Âme";

            $recipientName = $member['first_name'] . ' ' . ($member['last_name'] ?? $member['second_name'] ?? '');
            $result = $this->sendEmail($member['email'], $recipientName, $subject, $body);
            if ($result) {
                $this->logEmail($memberId, $member['email'], 'sponsor_tax_receipt', $subject, 'sent');
                return true;
            }
            error_log("Tax receipt email failed for member $memberId");
            return false;
        } catch (Exception $e) {
            error_log("Tax receipt PDF error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send tax receipt for sponsor donation (company, no member)
     * Sends to contact_email with company as donor (Impuesto de Sociedades)
     */
    public function sendSponsorTaxReceiptPdf($sponsorId, $variables, $contactEmail) {
        require_once __DIR__ . '/../tax-features.php';
        if (!tax_receipt_actions_enabled()) {
            return false;
        }
        if (floatval($variables['amount'] ?? 0) < 20) return false;
        try {
            $variables['payment_method'] = 'stripe';
            $variables['tax_type'] = 'company';
            require_once __DIR__ . '/TaxReceiptPdf.php';
            $pdf = new TaxReceiptPdf($variables);
            $pdfContent = $pdf->generate();
            $receiptId = $variables['receipt_id'] ?? 'EA-S' . date('Y') . '-' . str_pad($sponsorId, 6, '0', STR_PAD_LEFT);
            $downloadUrl = $this->storeTaxReceiptForDownload(0, $pdfContent, $receiptId); // member_id=0 for sponsor
            $subject = 'Your tax deduction certificate - Elektr-Âme (Impuesto de Sociedades)';
            $body = "Dear sponsor,\n\nYour official tax deduction certificate for your company's donation to Elektr-Âme is ready.\n\nDownload your PDF here (link valid 30 days):\n$downloadUrl\n\nYou can use this PDF when filing your Impuesto de Sociedades declaration.\n\nBest regards,\nThe Elektr-Âme Team";
            $result = $this->sendEmail($contactEmail, $variables['full_name'] ?? 'Sponsor', $subject, $body);
            return $result;
        } catch (Exception $e) {
            error_log("Sponsor tax receipt PDF error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get member data
     */
    private function getMemberData($memberId) {
        $stmt = $this->db->prepare("SELECT * FROM members WHERE id = :id");
        $stmt->execute([':id' => $memberId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /** Display name for email queue (To field) */
    private function memberDisplayName(array $member) {
        $last = $member['last_name'] ?? $member['second_name'] ?? '';
        return trim(($member['first_name'] ?? '') . ' ' . $last);
    }

    /**
     * Get member's preferred language
     */
    private function getMemberLanguage($memberId) {
        if (!$memberId) {
            return 'en';
        }

        $stmt = $this->db->prepare("SELECT country FROM members WHERE id = :id");
        $stmt->execute([':id' => $memberId]);
        $member = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$member) {
            return 'en';
        }

        // Determine language based on country
        $country = strtolower($member['country'] ?? '');
        if (strpos($country, 'spain') !== false || strpos($country, 'españa') !== false) {
            return 'es';
        } elseif (strpos($country, 'catalu') !== false) {
            return 'ca';
        }

        return 'en';
    }

    /**
     * Update queue status
     */
    private function updateQueueStatus($queueId, $status, $errorMessage = null) {
        // If status is 'sent', also update sent_at timestamp
        if ($status === 'sent') {
            $stmt = $this->db->prepare("
                UPDATE email_queue 
                SET status = :status, 
                    error_message = :error,
                    sent_at = NOW()
                WHERE id = :id
            ");
        } else {
            $stmt = $this->db->prepare("
                UPDATE email_queue 
                SET status = :status, 
                    error_message = :error
                WHERE id = :id
            ");
        }
        
        $stmt->execute([
            ':status' => $status,
            ':error' => $errorMessage,
            ':id' => $queueId
        ]);
    }

    /**
     * Log email send
     */
    private function logEmail($memberId, $email, $templateKey, $subject, $status, $errorMessage = null) {
        $stmt = $this->db->prepare("
            INSERT INTO email_logs 
            (member_id, email, template_key, subject, status, error_message)
            VALUES 
            (:member_id, :email, :template_key, :subject, :status, :error)
        ");
        $stmt->execute([
            ':member_id' => $memberId,
            ':email' => $email,
            ':template_key' => $templateKey,
            ':subject' => $subject,
            ':status' => $status,
            ':error' => $errorMessage
        ]);
    }

    /**
     * Get email statistics
     */
    public function getStatistics($days = 30) {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                template_key
            FROM email_logs
            WHERE sent_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
            GROUP BY template_key
        ");
        $stmt->execute([':days' => $days]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

