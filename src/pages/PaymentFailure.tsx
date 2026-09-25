import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw, CreditCard } from "lucide-react";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

const PaymentFailure = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <SEO
        title="Payment Cancelled | Elektr-Âme"
        description="Your payment was cancelled"
        url="https://www.elektr-ame.com/payment-cancelled"
        keywords="payment, cancelled, Elektr-Âme"
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Card className="bg-black/40 border-white/10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <CardTitle className="text-white text-3xl">Payment Cancelled</CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Your payment was not completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <p className="text-white/80 mb-4">
                  Your payment was cancelled or could not be processed. No charges were made to your account.
                </p>
                <p className="text-white/60 text-sm">
                  If you experienced any issues, please try again or contact us at{' '}
                  <a href="mailto:contact@elektr-ame.com" className="text-electric-blue hover:underline">
                    contact@elektr-ame.com
                  </a>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => navigate('/member-portal')}
                  className="flex-1 bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Try Again
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
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentFailure;

