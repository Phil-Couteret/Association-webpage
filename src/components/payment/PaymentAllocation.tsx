import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, AlertCircle, CheckCircle, Euro, Calculator, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { calculateTaxDeduction } from "@/utils/taxCalculations";

interface AllocationOption {
  type: 'membership_years' | 'sponsor_donation';
  years: number;
  amount: number;
  description: string;
}

interface AllocationData {
  unallocated_balance: number;
  allocated_balance: number;
  total_balance: number;
  options: AllocationOption[];
  current_membership: {
    membership_type: string;
    membership_start_date: string | null;
    membership_end_date: string | null;
    payment_status: string;
  };
}

const PaymentAllocation = () => {
  const [data, setData] = useState<AllocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchAllocationData();
  }, []);

  const fetchAllocationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/payment-allocation.php', {
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch allocation data');
      }

      setData(data);
      
      // Auto-select first (and only) option if available
      if (data.options && data.options.length > 0) {
        setSelectedOption(`${data.options[0].type}-${data.options[0].years}`);
      }
    } catch (err) {
      console.error('Allocation data error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load allocation data');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedOption || !data) return;

    const [type, yearsStr] = selectedOption.split('-');
    const years = parseInt(yearsStr);
    const option = data.options.find(opt => opt.type === type && opt.years === years);

    if (!option) {
      toast({
        title: "Invalid Selection",
        description: "Please select a valid allocation option",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/payment-allocation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          allocation_type: option.type,
          allocation_years: option.years,
        }),
      });

      const responseText = await response.text();
      let result;
      
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to process allocation');
      }

      toast({
        title: "Allocation Successful",
        description: "Your payment has been allocated successfully!",
      });

      // Refresh data
      await fetchAllocationData();
      
      // Refresh page after a moment to show updated membership
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error('Allocation error:', err);
      toast({
        title: "Allocation Error",
        description: err instanceof Error ? err.message : "Failed to process allocation",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-400">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || data.unallocated_balance <= 0) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <p className="text-white/70 text-lg mb-2">
              No Unallocated Balance
            </p>
            <p className="text-white/50 text-sm">
              All your payments have been allocated to your membership.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedOptionData = selectedOption 
    ? data.options.find(opt => `${opt.type}-${opt.years}` === selectedOption)
    : null;

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Allocate Payment Balance
        </CardTitle>
        <CardDescription className="text-white/70">
          Choose how to use your unallocated payment balance of €{data.unallocated_balance.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Summary */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-white/70 text-sm mb-1">Total Balance</p>
              <p className="text-xl font-bold text-white flex items-center justify-center gap-1">
                <Euro className="h-4 w-4" />
                {data.total_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Allocated</p>
              <p className="text-xl font-bold text-green-400 flex items-center justify-center gap-1">
                <Euro className="h-4 w-4" />
                {data.allocated_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Available</p>
              <p className="text-xl font-bold text-blue-400 flex items-center justify-center gap-1">
                <Euro className="h-4 w-4" />
                {data.unallocated_balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Allocation Options */}
        <div>
          <Label className="text-white mb-3 block">Allocation:</Label>
          <div className="space-y-3">
            {data.options.map((option, index) => {
              const optionId = `${option.type}-${option.years}`;
              const taxCalc = option.type === 'sponsor_donation' 
                ? calculateTaxDeduction(option.amount, false)
                : null;

              return (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white">{option.description}</p>
                    <p className="text-lg font-bold text-white flex items-center gap-1">
                      <Euro className="h-4 w-4" />
                      {option.amount.toFixed(2)}
                    </p>
                  </div>
                  
                  {option.type === 'membership_years' && (
                    <p className="text-sm text-white/60">
                      Extends your membership by {option.years} year{option.years > 1 ? 's' : ''}
                    </p>
                  )}
                  
                  {FEATURE_TAX_DEDUCTION_UI && option.type === 'sponsor_donation' && taxCalc && (
                    <div className="mt-3 bg-blue-500/20 rounded p-3 border border-blue-500/30">
                      <div className="flex items-start gap-2">
                        <Calculator className="h-4 w-4 text-blue-400 mt-0.5" />
                        <div className="flex-1 text-sm">
                          <p className="text-blue-300 font-semibold mb-1">Tax Deduction Benefits:</p>
                          <div className="space-y-1 text-blue-200">
                            <div className="flex justify-between">
                              <span>Tax Deduction:</span>
                              <span className="font-medium text-green-300">€{taxCalc.deductionAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Your Net Cost:</span>
                              <span className="font-medium">€{taxCalc.netCost.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-blue-300/80 mt-1">
                              Effective discount: {taxCalc.effectiveDiscount.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Membership Info */}
        {data.current_membership.membership_end_date && (
          <Alert className="bg-blue-500/20 border-blue-500/50">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              Current membership: {data.current_membership.membership_type} 
              {data.current_membership.membership_end_date && (
                <> (valid until {new Date(data.current_membership.membership_end_date).toLocaleDateString()})</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={handleAllocate}
          disabled={!selectedOption || processing}
          className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Allocation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentAllocation;

