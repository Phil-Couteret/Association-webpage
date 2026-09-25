<?php
/**
 * Update the tax receipt template to include the association NIF
 * Run this once to update the template in the database
 */

header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

session_start();

// Check authentication (admin only)
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

try {
    // Get current year for the template
    $currentYear = date('Y');
    
    // Update the sponsor_tax_receipt template with official format
    $sql = "UPDATE email_templates 
    SET 
        body_en = '═══════════════════════════════════════════════════════════
CERTIFICATE OF DONATION / MEMBERSHIP FEE
OFFICIAL TAX RECEIPT FOR TAX DEDUCTION PURPOSES
═══════════════════════════════════════════════════════════

Dear {{first_name}},

This document certifies your donation/membership fee payment to Elektr-Âme and serves as an official receipt for tax deduction purposes in accordance with Spanish tax law (Real Decreto-ley 6/2023).

═══════════════════════════════════════════════════════════
RECIPIENT ORGANIZATION
═══════════════════════════════════════════════════════════

Name: Elektr-Âme
Tax ID (NIF): G24808495
Address: Carrer Alcolea, 92, 08014 Barcelona, Spain
Legal Status: Non-profit Association
Registration: Registered in the General Registry of Associations

═══════════════════════════════════════════════════════════
DONOR INFORMATION
═══════════════════════════════════════════════════════════

Name: {{full_name}}
Email: {{email}}
Receipt Number: {{receipt_id}}
Date of Payment: {{date}}
Fiscal Year: $currentYear

═══════════════════════════════════════════════════════════
PAYMENT DETAILS
═══════════════════════════════════════════════════════════

Total Amount Donated: €{{amount}}
Payment Method: Online Payment
Payment Date: {{date}}

═══════════════════════════════════════════════════════════
TAX DEDUCTION CALCULATION
(Real Decreto-ley 6/2023, de 19 de diciembre)
═══════════════════════════════════════════════════════════

First €250.00 × 80% deduction:        €200.00
Amount above €250.00 × 40% deduction: €{{tax_deduction_above_250}}
───────────────────────────────────────────────────────────
TOTAL TAX DEDUCTION:                 €{{tax_deduction}}
NET COST AFTER DEDUCTION:            €{{net_cost}}
EFFECTIVE DISCOUNT:                   {{discount_percent}}%
───────────────────────────────────────────────────────────

{{recurring_bonus_info}}

═══════════════════════════════════════════════════════════
LEGAL INFORMATION
═══════════════════════════════════════════════════════════

This certificate is valid for personal income tax (IRPF) declaration for the fiscal year $currentYear.

According to Spanish tax law (Real Decreto-ley 6/2023):
- Donations up to €250: 80% tax deduction
- Donations above €250: 40% tax deduction (45% for recurring donors of 3+ consecutive years)

This document is issued in compliance with Spanish tax regulations and can be used as supporting documentation for your tax declaration.

═══════════════════════════════════════════════════════════

This is an official document. Please retain this email for your tax records.

For any questions regarding this receipt, please contact:
Email: contact@elektr-ame.com

Thank you for supporting electronic music culture in Catalonia.

Best regards,
Elektr-Âme Association
NIF: G24808495',
        body_es = '═══════════════════════════════════════════════════════════
CERTIFICADO DE DONACIÓN / CUOTA DE SOCIO
JUSTIFICANTE OFICIAL PARA DEDUCCIÓN FISCAL
═══════════════════════════════════════════════════════════

Estimado/a {{first_name}},

Este documento certifica su donación/cuota de socio a Elektr-Âme y sirve como justificante oficial para efectos de deducción fiscal conforme a la normativa fiscal española (Real Decreto-ley 6/2023, de 19 de diciembre).

═══════════════════════════════════════════════════════════
ENTIDAD BENEFICIARIA
═══════════════════════════════════════════════════════════

Denominación: Elektr-Âme
NIF: G24808495
Domicilio: Carrer Alcolea, 92, 08014 Barcelona, España
Naturaleza Jurídica: Asociación sin ánimo de lucro
Inscripción: Registrada en el Registro General de Asociaciones

═══════════════════════════════════════════════════════════
DATOS DEL DONANTE
═══════════════════════════════════════════════════════════

Nombre: {{full_name}}
Email: {{email}}
Número de Justificante: {{receipt_id}}
Fecha de Pago: {{date}}
Ejercicio Fiscal: $currentYear

═══════════════════════════════════════════════════════════
DETALLES DEL PAGO
═══════════════════════════════════════════════════════════

Importe Total Donado: €{{amount}}
Forma de Pago: Pago Online
Fecha de Pago: {{date}}

═══════════════════════════════════════════════════════════
CÁLCULO DE LA DEDUCCIÓN FISCAL
(Real Decreto-ley 6/2023, de 19 de diciembre)
═══════════════════════════════════════════════════════════

Primeros €250,00 × 80% deducción:        €200,00
Importe superior a €250,00 × 40% deducción: €{{tax_deduction_above_250}}
───────────────────────────────────────────────────────────
DEDUCCIÓN FISCAL TOTAL:                  €{{tax_deduction}}
COSTE NETO TRAS DEDUCCIÓN:               €{{net_cost}}
DESCUENTO EFECTIVO:                      {{discount_percent}}%
───────────────────────────────────────────────────────────

{{recurring_bonus_info}}

═══════════════════════════════════════════════════════════
INFORMACIÓN LEGAL
═══════════════════════════════════════════════════════════

Este certificado es válido para la declaración del Impuesto sobre la Renta de las Personas Físicas (IRPF) del ejercicio fiscal $currentYear.

Conforme a la normativa fiscal española (Real Decreto-ley 6/2023):
- Donaciones hasta €250: deducción fiscal del 80%
- Donaciones superiores a €250: deducción fiscal del 40% (45% para donantes recurrentes de 3+ años consecutivos)

Este documento se emite en cumplimiento de la normativa fiscal española y puede ser utilizado como documentación justificativa para su declaración de impuestos.

═══════════════════════════════════════════════════════════

Este es un documento oficial. Por favor, conserve este correo para sus registros fiscales.

Para cualquier consulta sobre este justificante, contacte:
Email: contact@elektr-ame.com

Gracias por apoyar la cultura de música electrónica en Cataluña.

Saludos cordiales,
Asociación Elektr-Âme
NIF: G24808495',
        body_ca = '═══════════════════════════════════════════════════════════
CERTIFICAT DE DONACIÓ / QUOTA DE SOCI
JUSTIFICANT OFICIAL PER A DEDUCCIÓ FISCAL
═══════════════════════════════════════════════════════════

Estimat/ada {{first_name}},

Aquest document certifica la vostra donació/quota de soci a Elektr-Âme i serveix com a justificant oficial per a efectes de deducció fiscal conforme a la normativa fiscal espanyola (Reial Decret-llei 6/2023, de 19 de desembre).

═══════════════════════════════════════════════════════════
ENTITAT BENEFICIÀRIA
═══════════════════════════════════════════════════════════

Denominació: Elektr-Âme
NIF: G24808495
Domicili: Carrer Alcolea, 92, 08014 Barcelona, Espanya
Naturalesa Jurídica: Associació sense ànim de lucre
Inscripció: Registrada al Registre General d''Associacions

═══════════════════════════════════════════════════════════
DADES DEL DONANT
═══════════════════════════════════════════════════════════

Nom: {{full_name}}
Email: {{email}}
Número de Justificant: {{receipt_id}}
Data de Pagament: {{date}}
Exercici Fiscal: $currentYear

═══════════════════════════════════════════════════════════
DETALLS DEL PAGAMENT
═══════════════════════════════════════════════════════════

Import Total Donat: €{{amount}}
Forma de Pagament: Pagament Online
Data de Pagament: {{date}}

═══════════════════════════════════════════════════════════
CÀLCUL DE LA DEDUCCIÓ FISCAL
(Reial Decret-llei 6/2023, de 19 de desembre)
═══════════════════════════════════════════════════════════

Primers €250,00 × 80% deducció:         €200,00
Import superior a €250,00 × 40% deducció: €{{tax_deduction_above_250}}
───────────────────────────────────────────────────────────
DEDUCCIÓ FISCAL TOTAL:                   €{{tax_deduction}}
COST NET TRAS DEDUCCIÓ:                  €{{net_cost}}
DESCOMPTE EFECTIU:                       {{discount_percent}}%
───────────────────────────────────────────────────────────

{{recurring_bonus_info}}

═══════════════════════════════════════════════════════════
INFORMACIÓ LEGAL
═══════════════════════════════════════════════════════════

Aquest certificat és vàlid per a la declaració de l''Impost sobre la Renda de les Persones Físiques (IRPF) de l''exercici fiscal $currentYear.

Conforme a la normativa fiscal espanyola (Reial Decret-llei 6/2023):
- Donacions fins a €250: deducció fiscal del 80%
- Donacions superiors a €250: deducció fiscal del 40% (45% per a donants recurrents de 3+ anys consecutius)

Aquest document s''emet en compliment de la normativa fiscal espanyola i pot ser utilitzat com a documentació justificativa per a la vostra declaració d''impostos.

═══════════════════════════════════════════════════════════

Aquest és un document oficial. Si us plau, conserveu aquest correu per als vostres registres fiscals.

Per a qualsevol consulta sobre aquest justificant, contacteu:
Email: contact@elektr-ame.com

Gràcies per donar suport a la cultura de música electrònica a Catalunya.

Salutacions cordials,
Associació Elektr-Âme
NIF: G24808495'
    WHERE template_key = 'sponsor_tax_receipt'";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $rowsAffected = $stmt->rowCount();
    
    if ($rowsAffected > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Tax receipt template updated successfully with NIF G24808495',
            'rows_affected' => $rowsAffected
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Template not found or no changes made. Make sure the sponsor_tax_receipt template exists.',
            'rows_affected' => $rowsAffected
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>

