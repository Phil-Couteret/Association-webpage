<?php
/**
 * Tax Deduction Calculator
 * Based on Real Decreto-ley 6/2023, de 19 de diciembre
 */

class TaxCalculator {
    /**
     * Calculate tax deduction for donation
     * 
     * @param float $amount Donation amount
     * @param int $recurringYears Number of consecutive years donating (0 for first time)
     * @return array Calculation details
     */
    public function calculate($amount, $recurringYears = 0) {
        $first250 = min($amount, 250);
        $above250 = max(0, $amount - 250);

        // 80% on first €250
        $deductionFirst250 = $first250 * 0.80;

        // 40% above €250 (or 45% if recurring for 3+ years)
        $rateAbove250 = ($recurringYears >= 3) ? 0.45 : 0.40;
        $deductionAbove250 = $above250 * $rateAbove250;

        $totalDeduction = $deductionFirst250 + $deductionAbove250;
        $netCost = $amount - $totalDeduction;
        $effectiveDiscount = ($amount > 0) ? ($totalDeduction / $amount * 100) : 0;

        return [
            'donation' => $amount,
            'deduction' => round($totalDeduction, 2),
            'netCost' => round($netCost, 2),
            'effectiveDiscount' => round($effectiveDiscount, 1),
            'recurringBonus' => ($recurringYears >= 3),
            'rateFirst250' => 80,
            'rateAbove250' => ($recurringYears >= 3) ? 45 : 40
        ];
    }

    /**
     * Check if member qualifies for recurring donor bonus
     */
    public function checkRecurringStatus($db, $memberId) {
        $stmt = $db->prepare("
            SELECT COUNT(*) as years
            FROM email_logs
            WHERE member_id = :member_id
            AND template_key = 'membership_renewed'
            AND YEAR(sent_at) >= YEAR(NOW()) - 3
            GROUP BY YEAR(sent_at)
        ");
        $stmt->execute([':member_id' => $memberId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ($result && $result['years'] >= 3);
    }
}

