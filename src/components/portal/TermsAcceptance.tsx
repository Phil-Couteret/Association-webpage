import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, CheckCircle, Loader2, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface TermsAcceptanceProps {
  termsAcceptedAt: string | null | undefined;
  paymentStatus: string;
  onAccepted: () => void;
  onGoToPayments?: () => void;
}

const TermsAcceptance = ({ termsAcceptedAt, paymentStatus, onAccepted, onGoToPayments }: TermsAcceptanceProps) => {
  const [acceptChecked, setAcceptChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const hasAccepted = !!termsAcceptedAt;
  const hasPaid = paymentStatus === 'paid';

  // Terms are set only when member has paid (Stripe, cash, wire, paycomet, other)
  const handleAccept = async () => {
    if (!acceptChecked) {
      setError(t('portal.terms.mustAccept'));
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/member-accept-terms.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: t('portal.terms.acceptedTitle'),
          description: t('portal.terms.acceptedMessage'),
        });
        onAccepted();
      } else {
        setError(data.error || t('portal.terms.acceptFailed'));
      }
    } catch {
      setError(t('portal.terms.acceptFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unpaid: must complete payment first (terms set when payment completes)
  if (!hasPaid) {
    return (
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            {t('portal.terms.title')}
          </CardTitle>
          <p className="text-white/80 text-sm mt-1">
            {t('portal.terms.payFirst')}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-white/70 text-sm mb-4">
            {t('portal.terms.payFirstDetail')}
          </p>
          {onGoToPayments && (
            <Button
              onClick={onGoToPayments}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {t('portal.terms.goToPayments')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (hasAccepted) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            {t('portal.terms.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/80">
            {t('portal.terms.acceptedOn')}{' '}
            <strong>{new Date(termsAcceptedAt).toLocaleDateString(undefined, { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</strong>
          </p>
          <Link 
            to="/terms-and-conditions" 
            className="text-electric-blue hover:underline text-sm mt-2 inline-block"
          >
            {t('portal.terms.viewTerms')}
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Paid but not yet accepted (legacy member) - can accept in portal
  return (
    <Card className="bg-amber-500/10 border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-400" />
          {t('portal.terms.title')}
        </CardTitle>
        <p className="text-white/80 text-sm mt-1">
          {t('portal.terms.requiredToSign')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptChecked}
            onChange={(e) => {
              setAcceptChecked(e.target.checked);
              setError("");
            }}
            className="mt-1 rounded border-white/20 text-electric-blue focus:ring-electric-blue"
          />
          <span className="text-white/90 text-sm">
            {t('portal.terms.acceptLabel')}{' '}
            <Link to="/terms-and-conditions" className="text-electric-blue hover:underline" target="_blank">
              {t('portal.terms.termsLink')}
            </Link>
            {' '}{t('portal.terms.and')}{' '}
            <Link to="/privacy-policy" className="text-electric-blue hover:underline" target="_blank">
              {t('portal.terms.privacyLink')}
            </Link>
          </span>
        </label>

        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleAccept}
          disabled={isSubmitting || !acceptChecked}
          className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('portal.terms.submitting')}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('portal.terms.acceptButton')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TermsAcceptance;
