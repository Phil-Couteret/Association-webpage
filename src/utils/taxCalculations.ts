/**
 * Tax deduction calculations for Spain (Real Decreto-ley 6/2023)
 * Effective from January 1, 2024
 */

export interface TaxDeductionResult {
  donationAmount: number;
  deductionAmount: number;
  netCost: number;
  effectiveDiscount: number; // percentage
  breakdown: {
    first250: number;
    above250: number;
  };
}

/**
 * Calculate tax deduction for donations/sponsorships in Spain
 * @param amount - Donation amount in euros
 * @param isRecurring - Whether this is a recurring donation (3+ consecutive years to same entity)
 * @returns Tax deduction calculation breakdown
 */
export function calculateTaxDeduction(
  amount: number,
  isRecurring: boolean = false
): TaxDeductionResult {
  if (amount <= 0) {
    return {
      donationAmount: 0,
      deductionAmount: 0,
      netCost: 0,
      effectiveDiscount: 0,
      breakdown: { first250: 0, above250: 0 }
    };
  }

  // First €250 at 80%
  const first250Amount = Math.min(amount, 250);
  const first250Deduction = first250Amount * 0.80;

  // Amount above €250
  const above250Amount = Math.max(0, amount - 250);
  // 40% standard, 45% if recurring 3+ years
  const above250Rate = isRecurring ? 0.45 : 0.40;
  const above250Deduction = above250Amount * above250Rate;

  // Total deduction
  const totalDeduction = first250Deduction + above250Deduction;
  const netCost = amount - totalDeduction;
  const effectiveDiscount = (totalDeduction / amount) * 100;

  return {
    donationAmount: amount,
    deductionAmount: Math.round(totalDeduction * 100) / 100,
    netCost: Math.round(netCost * 100) / 100,
    effectiveDiscount: Math.round(effectiveDiscount * 10) / 10,
    breakdown: {
      first250: Math.round(first250Deduction * 100) / 100,
      above250: Math.round(above250Deduction * 100) / 100
    }
  };
}

/**
 * Format tax deduction information for display
 */
export function formatTaxDeduction(result: TaxDeductionResult): string {
  return `You'll get €${result.deductionAmount.toFixed(2)} back from taxes (${result.effectiveDiscount}% effective discount). Net cost: €${result.netCost.toFixed(2)}`;
}

/**
 * Determine if an amount qualifies as sponsor (>€20)
 */
export function isSponsorAmount(amount: number): boolean {
  return amount > 20;
}

/**
 * Get membership type based on payment amount
 */
export function getMembershipTypeFromAmount(amount: number): 'free' | 'basic' | 'sponsor' {
  if (amount === 0) return 'free';
  if (amount === 20) return 'basic';
  if (amount > 20) return 'sponsor';
  return 'free';
}

/**
 * Get standard membership prices
 */
export const MEMBERSHIP_PRICES = {
  free: 0,
  basic: 20,
  sponsor: 20, // minimum, but any amount above qualifies
  lifetime: 500 // suggested price, can be adjusted
} as const;

/**
 * Calculate suggested sponsor amounts with their tax benefits
 */
export function getSuggestedSponsorAmounts(): Array<{
  amount: number;
  deduction: TaxDeductionResult;
  label: string;
}> {
  return [
    {
      amount: 50,
      deduction: calculateTaxDeduction(50),
      label: 'Supporter'
    },
    {
      amount: 100,
      deduction: calculateTaxDeduction(100),
      label: 'Bronze Sponsor'
    },
    {
      amount: 250,
      deduction: calculateTaxDeduction(250),
      label: 'Silver Sponsor'
    },
    {
      amount: 500,
      deduction: calculateTaxDeduction(500),
      label: 'Gold Sponsor'
    },
    {
      amount: 1000,
      deduction: calculateTaxDeduction(1000),
      label: 'Platinum Sponsor'
    }
  ];
}

/**
 * Generate tax receipt text
 */
export function generateTaxReceiptText(
  amount: number,
  memberName: string,
  memberId: string,
  date: Date,
  isRecurring: boolean = false
): string {
  const deduction = calculateTaxDeduction(amount, isRecurring);
  const year = date.getFullYear();
  
  return `
CERTIFICADO DE DONACIÓN / CUOTA DE SOCIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ELEKTR-ÂME
Carrer Alcolea, 92
08014 Barcelona
CIF: G24808495

BENEFICIARIO:
${memberName}
ID de Miembro: ${memberId}

IMPORTE DONADO: €${amount.toFixed(2)}
FECHA: ${date.toLocaleDateString('es-ES')}
AÑO FISCAL: ${year}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEDUCCIÓN FISCAL (Real Decreto-ley 6/2023)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primeros €250 × 80%:     €${deduction.breakdown.first250.toFixed(2)}
${amount > 250 ? `Resto €${(amount - 250).toFixed(2)} × ${isRecurring ? '45' : '40'}%:     €${deduction.breakdown.above250.toFixed(2)}` : ''}
────────────────────────────────────────
DEDUCCIÓN TOTAL:         €${deduction.deductionAmount.toFixed(2)}
COSTE NETO:              €${deduction.netCost.toFixed(2)}
────────────────────────────────────────

Ahorro efectivo: ${deduction.effectiveDiscount.toFixed(1)}%

${isRecurring ? '⭐ Donante recurrente (3+ años consecutivos)\n' : ''}
Este certificado es válido para la declaración de IRPF ${year}.

Gracias por tu apoyo a la música electrónica en Barcelona.
`;
}

