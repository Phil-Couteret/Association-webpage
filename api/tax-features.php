<?php
/**
 * Tax receipt PDF / deduction actions — disabled until fiscal compliance is confirmed.
 * Call sites and EmailAutomation methods remain; guards use this flag.
 *
 * @return bool When true, sendTaxReceiptPdf / sponsor flows may run.
 */
function tax_receipt_actions_enabled(): bool {
    return false;
}
