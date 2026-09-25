import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link } from "react-router-dom";
import { CreditCard, Loader2, AlertCircle, CheckCircle, Euro, Calendar, Info, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { calculateTaxDeduction, TaxDeductionResult } from "@/utils/taxCalculations";

interface CompanyDetails {
  company_name: string;
  company_cif: string;
  company_address?: string;
}

interface PaymentCheckoutProps {
  memberId: number;
  currentMembershipType?: string;
  currentPaymentStatus?: string;
  companyDetails?: CompanyDetails | null;
  onPaymentSuccess?: () => void;
}

type PaymentStep = 'selection' | 'amount' | 'confirmation';

const PaymentCheckout = ({ memberId, currentMembershipType, currentPaymentStatus, companyDetails, onPaymentSuccess }: PaymentCheckoutProps) => {
  const [selectedType, setSelectedType] = useState<'basic' | 'custom'>('basic');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<PaymentStep>('selection');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taxCalculation, setTaxCalculation] = useState<TaxDeductionResult | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [payOnBehalfOfCompany, setPayOnBehalfOfCompany] = useState(false);
  const [gateways, setGateways] = useState<string[]>(['stripe']);
  const [selectedGateway, setSelectedGateway] = useState<string>('stripe');
  const hasCompanyDetails = companyDetails && companyDetails.company_name && companyDetails.company_cif;
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch active payment gateways on mount
  useEffect(() => {
    fetch('/api/payment/active-gateways.php', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.gateways) && d.gateways.length > 0) {
          setGateways(d.gateways);
          setSelectedGateway(d.gateways.includes('stripe') ? 'stripe' : d.gateways[0]);
        }
      })
      .catch(() => {});
  }, []);

  const BASIC_MEMBERSHIP_PRICE = 20.00; // €20/year
  const MINIMUM_CUSTOM_AMOUNT = 20.00; // Minimum €20

  const getMembershipDescription = (type: string) => {
    switch (type) {
      case 'basic':
        return 'Basic membership - Full access to Elektr-Âme community for 1 year';
      case 'custom':
        return FEATURE_TAX_DEDUCTION_UI
          ? 'Custom amount - Pay any amount you wish (minimum €20). Amounts above €20 qualify for tax deduction benefits.'
          : 'Custom amount - Pay any amount you wish (minimum €20).';
      default:
        return '';
    }
  };

  const calculateAmount = (): number => {
    if (selectedType === 'basic') {
      return BASIC_MEMBERSHIP_PRICE;
    }
    const amount = parseFloat(customAmount);
    return isNaN(amount) ? 0 : amount;
  };

  // Step 1: Validate amount
  const validateAmount = (): boolean => {
    if (selectedType === 'basic') {
      return true; // Basic is always valid
    }

    const amount = parseFloat(customAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return false;
    }

    if (amount < MINIMUM_CUSTOM_AMOUNT) {
      toast({
        title: "Invalid Amount",
        description: `Minimum amount is €${MINIMUM_CUSTOM_AMOUNT.toFixed(2)}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Step 2: Calculate tax deduction and show confirmation
  const handleAmountValidation = () => {
    if (!validateAmount()) {
      return;
    }

    const amount = calculateAmount();
    
    if (FEATURE_TAX_DEDUCTION_UI && amount > MINIMUM_CUSTOM_AMOUNT) {
      const taxCalc = calculateTaxDeduction(amount, false); // TODO: Check if recurring donor
      setTaxCalculation(taxCalc);
    } else {
      setTaxCalculation(null);
    }

    setCurrentStep('confirmation');
  };

  // Step 3: Proceed to Stripe
  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const amount = calculateAmount();
      
      // Determine membership type for backend
      // If amount is exactly €20, it's 'basic', otherwise it's 'sponsor'
      const membershipType = (selectedType === 'basic' || amount === BASIC_MEMBERSHIP_PRICE) ? 'basic' : 'sponsor';

      const response = await fetch('/api/payment/create-checkout.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          gateway: selectedGateway,
          membership_type: membershipType,
          amount: amount,
          terms_accepted: acceptTerms,
          tax_fiscal_recipient:
            FEATURE_TAX_DEDUCTION_UI && hasCompanyDetails && payOnBehalfOfCompany ? 'company' : 'personal',
          company_name:
            FEATURE_TAX_DEDUCTION_UI && hasCompanyDetails && payOnBehalfOfCompany ? companyDetails.company_name : null,
          company_cif:
            FEATURE_TAX_DEDUCTION_UI && hasCompanyDetails && payOnBehalfOfCompany ? companyDetails.company_cif : null,
          company_address:
            FEATURE_TAX_DEDUCTION_UI && hasCompanyDetails && payOnBehalfOfCompany
              ? companyDetails.company_address
              : null,
        }),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (data.success && data.redsys_form) {
        const rf = data.redsys_form as {
          action: string;
          Ds_SignatureVersion: string;
          Ds_MerchantParameters: string;
          Ds_Signature: string;
        };
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = rf.action;
        const fields: [string, string][] = [
          ['Ds_SignatureVersion', rf.Ds_SignatureVersion],
          ['Ds_MerchantParameters', rf.Ds_MerchantParameters],
          ['Ds_Signature', rf.Ds_Signature],
        ];
        for (const [name, value] of fields) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const currentAmount = calculateAmount();
  const showTaxDeduction =
    FEATURE_TAX_DEDUCTION_UI && taxCalculation && currentAmount > MINIMUM_CUSTOM_AMOUNT;

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Membership Payment
        </CardTitle>
        <CardDescription className="text-white/70">
          Complete your membership payment securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Selection */}
        {currentStep === 'selection' && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-electric-blue/20 px-2 py-0.5 rounded text-electric-blue">1</span>
                Membership Type
              </h3>
              <RadioGroup
                value={selectedType}
                onValueChange={(value: 'basic' | 'custom') => {
                  setSelectedType(value);
                  if (value === 'basic') {
                    setCustomAmount('');
                  }
                }}
                className="grid gap-3"
              >
                <label
                  htmlFor="basic"
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === 'basic'
                      ? 'border-electric-blue bg-electric-blue/10'
                      : 'border-white/20 bg-black/20 hover:border-white/40 hover:bg-black/30'
                  }`}
                >
                  <RadioGroupItem value="basic" id="basic" className="mt-1 text-electric-blue border-white/40" />
                  <div className="flex-1">
                    <span className="font-semibold text-white block">
                      Basic - €{BASIC_MEMBERSHIP_PRICE.toFixed(2)}/year
                    </span>
                    <span className="text-white/70 text-sm mt-1 block">
                      {getMembershipDescription('basic')}
                    </span>
                  </div>
                </label>
                <label
                  htmlFor="custom"
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedType === 'custom'
                      ? 'border-electric-blue bg-electric-blue/10'
                      : 'border-white/20 bg-black/20 hover:border-white/40 hover:bg-black/30'
                  }`}
                >
                  <RadioGroupItem value="custom" id="custom" className="mt-1 text-electric-blue border-white/40" />
                  <div className="flex-1">
                    <span className="font-semibold text-white block">
                      Free Amount (minimum €{MINIMUM_CUSTOM_AMOUNT.toFixed(2)})
                    </span>
                    <span className="text-white/70 text-sm mt-1 block">
                      {getMembershipDescription('custom')}
                    </span>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Amount Input (for custom) */}
            {selectedType === 'custom' && (
              <div>
                <Label htmlFor="amount" className="text-white mb-2 block">
                  Amount (€)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min={MINIMUM_CUSTOM_AMOUNT}
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder={`${MINIMUM_CUSTOM_AMOUNT.toFixed(2)}`}
                />
                <p className="text-white/60 text-sm mt-2">
                  Minimum €{MINIMUM_CUSTOM_AMOUNT.toFixed(2)}.
                  {FEATURE_TAX_DEDUCTION_UI &&
                    ` Amounts above €${MINIMUM_CUSTOM_AMOUNT.toFixed(2)} qualify for tax deduction benefits.`}
                </p>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-white/80">
                  <span>Membership Type:</span>
                  <span className="font-medium capitalize">
                    {selectedType === 'basic' ? 'Basic' : 'Custom Amount'}
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Amount:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    {selectedType === 'basic' 
                      ? BASIC_MEMBERSHIP_PRICE.toFixed(2)
                      : customAmount ? parseFloat(customAmount).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-white/60 text-sm mt-3 pt-3 border-t border-white/10">
                  <span>Valid for:</span>
                  <span>1 year from payment date</span>
                </div>
              </div>
            </div>

            {/* Action Button - Step 1 */}
            <Button
              onClick={() => {
                if (selectedType === 'basic') {
                  // Skip to confirmation for basic
                  setTaxCalculation(null);
                  setCurrentStep('confirmation');
                } else {
                  handleAmountValidation();
                }
              }}
              disabled={isProcessing || (selectedType === 'custom' && !customAmount)}
              className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              {selectedType === 'basic' ? 'Continue' : 'Validate Amount'}
            </Button>
          </>
        )}

        {/* Step 2: Confirmation with Tax Deduction */}
        {currentStep === 'confirmation' && (
          <>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Payment Confirmation
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-white/80">
                  <span>Membership Type:</span>
                  <span className="font-medium capitalize">
                    {selectedType === 'basic' ? 'Basic' : 'Custom Amount'}
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Amount:</span>
                  <span className="font-bold text-white flex items-center gap-1">
                    <Euro className="h-4 w-4" />
                    {currentAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Valid for:</span>
                  <span>1 year from payment date</span>
                </div>
              </div>

              {/* Tax Deduction Display */}
              {showTaxDeduction && taxCalculation && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/50">
                    <div className="flex items-start gap-2 mb-3">
                      <Calculator className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-blue-300 font-semibold mb-2">Tax Deduction Benefits</h4>
                        <div className="space-y-2 text-sm text-blue-200">
                          <div className="flex justify-between">
                            <span>Donation Amount:</span>
                            <span className="font-medium">€{taxCalculation.donationAmount.toFixed(2)}</span>
                          </div>
                          {taxCalculation.donationAmount <= 250 ? (
                            <div className="flex justify-between">
                              <span>Tax Deduction (80% on first €250):</span>
                              <span className="font-medium text-green-300">€{taxCalculation.deductionAmount.toFixed(2)}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span>Deduction on first €250 (80%):</span>
                                <span className="font-medium">€{taxCalculation.breakdown.first250.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Deduction above €250 (40%):</span>
                                <span className="font-medium">€{taxCalculation.breakdown.above250.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-blue-500/30">
                                <span className="font-semibold">Total Tax Deduction:</span>
                                <span className="font-bold text-green-300">€{taxCalculation.deductionAmount.toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between pt-2 border-t border-blue-500/30">
                            <span className="font-semibold">Your Net Cost:</span>
                            <span className="font-bold text-white">€{taxCalculation.netCost.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-blue-300/80 mt-2">
                            Effective discount: {taxCalculation.effectiveDiscount.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <Alert className="bg-blue-500/10 border-blue-500/30 mt-3">
                      <Info className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-300 text-xs">
                        You'll receive a tax receipt via email after payment. This can be used for your Spanish tax declaration (IRPF).
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              {FEATURE_TAX_DEDUCTION_UI && !showTaxDeduction && currentAmount > MINIMUM_CUSTOM_AMOUNT && (
                <Alert className="bg-blue-500/20 border-blue-500/50 mt-4">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300 text-sm">
                    Amounts above €{MINIMUM_CUSTOM_AMOUNT.toFixed(2)} qualify for tax deduction benefits. You'll receive a tax receipt via email.
                  </AlertDescription>
                </Alert>
              )}

              {/* Pay on behalf of company (when member has company details) */}
              {FEATURE_TAX_DEDUCTION_UI && hasCompanyDetails && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payOnBehalfOfCompany}
                      onChange={(e) => setPayOnBehalfOfCompany(e.target.checked)}
                      className="mt-1 rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                    />
                    <div>
                      <span className="text-white/90 text-sm font-medium">
                        Issue tax receipt to company
                      </span>
                      <p className="text-white/60 text-xs mt-0.5">
                        {companyDetails.company_name} (CIF: {companyDetails.company_cif}). The tax receipt will be sent to your email for the company. For Impuesto de Sociedades.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Gateway selector (when multiple available) */}
              {gateways.length > 1 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <Label className="text-white mb-2 block">Payment method</Label>
                  <RadioGroup
                    value={selectedGateway}
                    onValueChange={setSelectedGateway}
                    className="flex gap-4"
                  >
                    {gateways.map((g) => (
                      <label
                        key={g}
                        className={`flex items-center gap-2 cursor-pointer ${selectedGateway === g ? 'text-electric-blue' : 'text-white/70'}`}
                      >
                        <RadioGroupItem value={g} className="text-electric-blue" />
                        <span className="capitalize">
                          {g === 'paycomet' ? 'Card (Paycomet)' : g === 'redsys' ? 'Redsys' : g === 'stripe' ? 'Stripe' : g}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Terms acceptance */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                  />
                  <span className="text-white/90 text-sm">
                    {t('payment.acceptTerms')}{' '}
                    <Link to="/terms-and-conditions" className="text-electric-blue hover:underline" target="_blank">
                      {t('payment.termsLink')}
                    </Link>
                    {' '}{t('payment.and')}{' '}
                    <Link to="/privacy-policy" className="text-electric-blue hover:underline" target="_blank">
                      {t('payment.privacyLink')}
                    </Link>
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons - Step 2 */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('selection')}
                disabled={isProcessing}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing || !acceptTerms}
                className="flex-1 bg-electric-blue hover:bg-electric-blue/80 text-deep-purple disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with{' '}
                    {selectedGateway === 'paycomet'
                      ? 'Card'
                      : selectedGateway === 'redsys'
                        ? 'Redsys'
                        : 'Stripe'}
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Security Notice */}
        <p className="text-white/50 text-xs text-center">
          🔒 Your payment is processed securely. We never store your card details.
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentCheckout;
