<?php
/**
 * Generate PDF tax receipt for Spanish IRPF declaration (Hacienda)
 * Clean format suitable for Hacienda portal upload
 * FPDF uses ISO-8859-1; we convert UTF-8 to Latin-1 for correct accents
 */

require_once __DIR__ . '/../libs/fpdf.php';

class TaxReceiptPdf extends FPDF {
    private $receiptId;
    private $variables;

    public function __construct($variables) {
        parent::__construct();
        $this->receiptId = $variables['receipt_id'] ?? 'EA-' . date('Y') . '-000000';
        $this->variables = $variables;
    }

    /** Convert UTF-8 to ISO-8859-1 for FPDF (fixes ó, ñ, á, etc.) */
    private function t($str) {
        return mb_convert_encoding($str, 'ISO-8859-1', 'UTF-8');
    }

    public function generate() {
        $this->AddPage();
        $this->SetFont('Helvetica', '', 10);
        $this->SetAutoPageBreak(true, 15);

        // Header (Spanish - document for Hacienda/Spain only)
        $isCompany = ($this->variables['tax_type'] ?? '') === 'company';
        $this->SetFont('Helvetica', 'B', 14);
        $this->Cell(0, 8, $this->t('CERTIFICADO DE DONACIÓN / CUOTA DE SOCIO'), 0, 1, 'C');
        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, $this->t($isCompany ? 'Recibo oficial para deducción fiscal (Impuesto de Sociedades)' : 'Recibo oficial para deducción fiscal (IRPF)'), 0, 1, 'C');
        $this->SetFont('Helvetica', '', 10);
        $this->Ln(5);

        // Organization
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, $this->t('Organización receptora'), 0, 1);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, $this->t('Nombre: Elektr-Ame'), 0, 1);
        $this->Cell(0, 5, 'NIF: G24808495', 0, 1);
        $this->Cell(0, 5, $this->t('Dirección: Carrer Alcolea, 92, 08014 Barcelona, España'), 0, 1);
        $this->Cell(0, 5, $this->t('Estado legal: Asociación sin ánimo de lucro'), 0, 1);
        $this->Ln(5);

        // Donor (personal or company)
        $isCompany = ($this->variables['tax_type'] ?? '') === 'company';
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, $this->t($isCompany ? 'Datos del donante (empresa)' : 'Datos del donante'), 0, 1);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, $this->t('Nombre: ') . $this->t($this->variables['full_name'] ?? ''), 0, 1);
        if ($isCompany && !empty($this->variables['company_cif'])) {
            $this->Cell(0, 5, $this->t('CIF/NIF: ') . $this->t($this->variables['company_cif']), 0, 1);
            if (!empty($this->variables['company_address'])) {
                $this->Cell(0, 5, $this->t('Dirección: ') . $this->t($this->variables['company_address']), 0, 1);
            }
        } else {
            $this->Cell(0, 5, $this->t('Correo: ') . $this->t($this->variables['email'] ?? ''), 0, 1);
        }
        $this->Cell(0, 5, $this->t('Número de recibo: ') . $this->receiptId, 0, 1);
        $dateStr = $this->variables['date'] ?? date('Y-m-d');
        $ts = is_numeric(strtotime($dateStr)) ? strtotime($dateStr) : time();
        $meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        $fechaEsp = date('j', $ts) . ' de ' . $meses[(int)date('n', $ts) - 1] . ' de ' . date('Y', $ts);
        $this->Cell(0, 5, $this->t('Fecha: ') . $fechaEsp, 0, 1);
        $this->Cell(0, 5, $this->t('Ejercicio fiscal: ') . date('Y'), 0, 1);
        $this->Ln(5);

        // Payment details
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, $this->t('Detalles del pago'), 0, 1);
        $this->SetFont('Helvetica', '', 9);
        $amount = $this->variables['amount'] ?? 0;
        if (is_numeric($amount)) $amount = number_format($amount, 2);
        $this->Cell(0, 5, $this->t('Importe total donado: ') . $amount . ' EUR', 0, 1);
        $methodLabels = [
            'wire_transfer' => 'Transferencia bancaria',
            'cash' => 'Efectivo',
            'stripe' => 'Tarjeta (Stripe)',
            'paycomet' => 'Paycomet',
            'other' => 'Otro'
        ];
        $method = $this->variables['payment_method'] ?? 'stripe';
        $methodLabel = $methodLabels[$method] ?? ucfirst(str_replace('_', ' ', $method));
        $this->Cell(0, 5, $this->t('Forma de pago: ') . $this->t($methodLabel), 0, 1);
        $this->Ln(5);

        // Tax deduction (Real Decreto-ley 6/2023)
        $this->SetFont('Helvetica', 'B', 10);
        $this->Cell(0, 6, $this->t('Cálculo de deducción fiscal (Real Decreto-ley 6/2023)'), 0, 1);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, $this->t('Primeros 250,00 EUR x 80%: ') . ($this->variables['tax_deduction_first_250'] ?? '0.00') . ' EUR', 0, 1);
        $this->Cell(0, 5, $this->t('Importe superior a 250,00 EUR x 40%: ') . ($this->variables['tax_deduction_above_250'] ?? '0.00') . ' EUR', 0, 1);
        $this->Ln(5);
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(0, 5, $this->t('Deducción fiscal total: ') . ($this->variables['tax_deduction'] ?? '0.00') . ' EUR', 0, 1);
        $this->Cell(0, 5, $this->t('Coste neto tras deducción: ') . ($this->variables['net_cost'] ?? '0.00') . ' EUR', 0, 1);
        $this->Cell(0, 5, $this->t('Descuento efectivo: ') . ($this->variables['discount_percent'] ?? '0') . '%', 0, 1);
        $this->SetFont('Helvetica', '', 9);
        $this->Ln(5);

        // Legal
        $this->SetFont('Helvetica', '', 8);
        if ($isCompany) {
            $this->MultiCell(0, 4, $this->t('Este certificado es válido para la declaración del Impuesto sobre Sociedades. Según la normativa fiscal española: las donaciones a entidades de utilidad pública tienen deducción fiscal en el Impuesto sobre Sociedades.'), 0, 'L');
        } else {
            $this->MultiCell(0, 4, $this->t('Este certificado es válido para la declaración del Impuesto sobre la Renta de las Personas Físicas (IRPF). Según la normativa fiscal española: las donaciones hasta 250 EUR tienen una deducción del 80%; los importes superiores a 250 EUR tienen una deducción del 40% (45% para donantes recurrentes de 3 o más años consecutivos).'), 0, 'L');
        }
        $this->Ln(5);
        $this->Cell(0, 5, $this->t('Para consultas: ') . 'contact@elektr-ame.com', 0, 1);
        $this->Cell(0, 5, $this->t('Asociación Elektr-Ame - NIF: G24808495'), 0, 1);

        return $this->Output('S'); // Return PDF as string
    }
}
