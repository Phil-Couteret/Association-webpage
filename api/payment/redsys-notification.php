<?php
/**
 * RedSys notificación online (POST desde TPV).
 */
ob_start();
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../classes/RedsysPayment.php';
require_once __DIR__ . '/../classes/EmailAutomation.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $redsys = new RedsysPayment($pdo);
    if (!$redsys->isConfigured()) {
        http_response_code(503);
        echo 'ERROR';
        exit;
    }

    $post = $_POST;
    if (empty($post['Ds_MerchantParameters'])) {
        http_response_code(400);
        echo 'ERROR';
        exit;
    }

    $result = $redsys->processNotification($post);

    if (!empty($result['already_processed'])) {
        echo 'OK';
        exit;
    }

    if ($result['success']) {
        $memberId = $result['member_id'];
        $amount = $result['amount'];
        $membershipType = ($result['membership_type'] ?? 'basic') === 'lifetime' ? 'lifetime' : 'yearly';
        $membershipStartDate = $result['membership_start_date'] ?? date('Y-m-d');
        $membershipEndDate = $result['membership_end_date'] ?? null;

        $memberStmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
        $memberStmt->execute([$memberId]);
        $memberBefore = $memberStmt->fetch(PDO::FETCH_ASSOC);

        $updateStmt = $pdo->prepare("
            UPDATE members SET
                membership_type = ?, membership_start_date = ?, membership_end_date = ?,
                payment_status = 'paid', payment_amount = ?, last_payment_date = CURDATE(), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $updateStmt->execute([$membershipType, $membershipStartDate, $membershipEndDate, $amount, $memberId]);

        $memberStmt->execute([$memberId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        if ($member) {
            $emailAutomation = new EmailAutomation($pdo);
            $isFirstPayment = $memberBefore && empty($memberBefore['last_payment_date']);
            if ($isFirstPayment) {
                $emailAutomation->queueEmail($member['email'], $member['first_name'] . ' ' . $member['last_name'], 'member_welcome', ['first_name' => $member['first_name'], 'membership_type' => ucfirst($membershipType)], $memberId, 'high');
            }
            $emailAutomation->queueEmail($member['email'], $member['first_name'] . ' ' . $member['last_name'], 'payment_confirmation', ['first_name' => $member['first_name'], 'amount' => number_format($amount, 2), 'membership_type' => ucfirst($membershipType), 'date' => date('Y-m-d')], $memberId, 'high');
            $memberCountry = $member['country'] ?? '';
            if ($emailAutomation->isSpainResident($memberCountry) && $amount >= 20) {
                $memberForTax = array_merge($member, ['payment_amount' => $amount, 'membership_type' => $membershipType]);
                $companyOverride = null;
                $merchantDataB64 = $post['Ds_MerchantParameters'] ?? '';
                if ($merchantDataB64 !== '') {
                    $decodedParams = $redsys->decodeParameters($merchantDataB64);
                    $mdRaw = is_array($decodedParams) ? ($decodedParams['Ds_Merchant_MerchantData'] ?? '') : '';
                    if ($mdRaw !== '') {
                        $mdJson = base64_decode($mdRaw, true);
                        if ($mdJson !== false) {
                            $md = json_decode($mdJson, true);
                            if (is_array($md) && !empty($md['tax_company']) && !empty($md['tax_cif'])) {
                                $companyOverride = [
                                    'company_name' => $md['tax_company'],
                                    'company_cif' => $md['tax_cif'],
                                    'company_address' => $md['tax_address'] ?? ($md['company_address'] ?? null),
                                ];
                            }
                        }
                    }
                }
                $variables = $emailAutomation->preparePaymentTaxVariables($memberForTax, $companyOverride);
                $emailAutomation->sendTaxReceiptPdf($memberId, $variables);
            }
            $emailAutomation->processQueue(10);
        }
    }

    echo 'OK';
} catch (Exception $e) {
    error_log('Redsys notification: ' . $e->getMessage());
    http_response_code(500);
    echo 'ERROR';
}
