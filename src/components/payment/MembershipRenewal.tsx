import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import PaymentCheckout from "./PaymentCheckout";

interface MembershipRenewalProps {
  currentMembershipType: 'in_progress' | 'yearly' | 'lifetime';
  membershipEndDate?: string;
  onRenewalComplete?: () => void;
}

const MembershipRenewal = ({ 
  currentMembershipType, 
  membershipEndDate,
  onRenewalComplete 
}: MembershipRenewalProps) => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (membershipEndDate) {
      const endDate = new Date(membershipEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysUntilExpiry(diffDays);
      setIsExpired(diffDays < 0);
    }
  }, [membershipEndDate]);

  const handleRenewalSuccess = () => {
    setShowCheckout(false);
    if (onRenewalComplete) {
      onRenewalComplete();
    }
    toast({
      title: "Renewal Initiated",
      description: "Redirecting to payment...",
    });
  };

  if (currentMembershipType === 'lifetime') {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-green-400" />
            <div>
              <h3 className="text-white font-semibold">Lifetime Membership</h3>
              <p className="text-white/70 text-sm">Your membership never expires!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showCheckout) {
    return (
      <PaymentCheckout
        memberId={0} // Will be set from session
        currentMembershipType={currentMembershipType}
        currentPaymentStatus={undefined}
        onPaymentSuccess={handleRenewalSuccess}
      />
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Membership Renewal
        </CardTitle>
        <CardDescription className="text-white/70">
          {isExpired 
            ? 'Your membership has expired. Renew now to continue enjoying member benefits.'
            : membershipEndDate 
              ? `Your membership expires on ${new Date(membershipEndDate).toLocaleDateString()}`
              : 'Renew your membership to continue enjoying member benefits.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExpired && (
          <Alert className="bg-red-500/20 border-red-500/50">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Your membership expired {Math.abs(daysUntilExpiry || 0)} days ago. Renew now to restore access.
            </AlertDescription>
          </Alert>
        )}

        {!isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
          <Alert className="bg-yellow-500/20 border-yellow-500/50">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              Your membership expires in {daysUntilExpiry} days. Renew early to avoid interruption.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-2">Renewal Options</h3>
          <div className="space-y-2 text-sm text-white/80">
            {currentMembershipType === 'in_progress' && (
              <p>Complete your membership payment (€20/year) to unlock all member benefits.</p>
            )}
            {currentMembershipType === 'yearly' && (
              <p>
                Renew your yearly membership. Choose €20 for basic
                {FEATURE_TAX_DEDUCTION_UI ? ' or any amount above €20 for tax benefits' : ' or a higher amount to support the association'}.
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={() => setShowCheckout(true)}
          className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {isExpired ? 'Renew Membership' : 'Renew Now'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MembershipRenewal;

