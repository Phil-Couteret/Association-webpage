import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Home, Download, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const gatewayParam = searchParams.get('gateway');
  const gateway =
    gatewayParam ??
    (sessionId ? 'stripe' : orderId ? 'paycomet' : 'stripe');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sessionId || orderId) {
      confirmPayment();
    } else {
      setError('No payment session found');
      setIsConfirming(false);
    }
  }, [sessionId, orderId]);

  const confirmPayment = async () => {
    try {
      const body: Record<string, string> =
        gateway === 'redsys' && orderId
          ? { order_id: orderId, gateway: 'redsys' }
          : gateway === 'paycomet'
            ? { order_id: orderId!, gateway: 'paycomet' }
            : { session_id: sessionId! };
      const response = await fetch('/api/payment/confirm-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }

      if (data.success) {
        setPaymentData(data);
        toast({
          title: "Payment Confirmed",
          description: "Your membership has been activated successfully!",
        });
      } else {
        throw new Error(data.error || 'Payment confirmation failed');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
      toast({
        title: "Confirmation Error",
        description: err instanceof Error ? err.message : "Failed to confirm payment",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <>
      <SEO
        title="Payment Successful | Elektr-Âme"
        description="Your payment has been processed successfully"
        url="https://www.elektr-ame.com/payment-success"
        keywords="payment, success, membership, Elektr-Âme"
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          {isConfirming ? (
            <Card className="bg-black/40 border-white/10">
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 text-electric-blue animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Confirming Payment...</h2>
                <p className="text-white/70">Please wait while we verify your payment</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Payment Confirmation Error</CardTitle>
                <CardDescription className="text-white/70">
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate('/member-portal')}
                    className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                  >
                    Go to Member Portal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black/40 border-white/10">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
                <CardTitle className="text-white text-3xl">Payment Successful!</CardTitle>
                <CardDescription className="text-white/70 text-lg">
                  Your membership has been activated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentData && (
                  <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                    <h3 className="text-white font-semibold mb-4">Payment Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-white/80">
                        <span>Membership Type:</span>
                        <span className="font-medium capitalize text-white">
                          {paymentData.membership_type}
                        </span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Amount:</span>
                        <span className="font-bold text-white">
                          €{parseFloat(paymentData.amount).toFixed(2)}
                        </span>
                      </div>
                      {paymentData.membership_start_date && (
                        <div className="flex justify-between text-white/80">
                          <span>Valid From:</span>
                          <span className="text-white">
                            {new Date(paymentData.membership_start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {paymentData.membership_end_date && (
                        <div className="flex justify-between text-white/80">
                          <span>Valid Until:</span>
                          <span className="text-white">
                            {new Date(paymentData.membership_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    ✅ A confirmation email has been sent to your email address.
                    {FEATURE_TAX_DEDUCTION_UI && paymentData?.amount >= 20 && (
                      <span className="block mt-2">
                        📄 Spain residents: your tax receipt PDF has been sent to your email.
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/member-portal')}
                    className="flex-1 bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Go to Member Portal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;

