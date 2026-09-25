import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Euro, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MembershipProducts = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const handleJoinNow = () => {
    navigate('/join-us');
  };

  return (
    <>
      <SEO 
        title={t('products.title')}
        description={t('products.description')}
        url="https://www.elektr-ame.com/membership"
        keywords="membership, join, pricing, Elektr-Âme, basic membership, support membership"
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-8">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold text-white mb-2">{t('products.title')}</h1>
            <p className="text-white/70 text-lg">{t('products.description')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Membership */}
            <Card className="bg-black/40 border-white/10 hover:border-electric-blue/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {t('products.basicTitle')}
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-electric-blue">
                    {t('products.basicPrice')}
                  </span>
                  <span className="text-white/70">{t('products.basicPeriod')}</span>
                </div>
                <CardDescription className="text-white/80 mt-2">
                  {t('products.basicDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-3">{t('products.basicFeatures')}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature1')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature2')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature3')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature4')}</span>
                    </li>
                    {FEATURE_TAX_DEDUCTION_UI && (
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature5')}</span>
                    </li>
                    )}
                  </ul>
                </div>
                <Button
                  onClick={handleJoinNow}
                  className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('products.buyNow')}
                </Button>
              </CardContent>
            </Card>

            {/* Support Membership */}
            <Card className="bg-black/40 border-white/10 hover:border-electric-blue/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {t('products.supportTitle')}
                </CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-electric-blue">
                    {t('products.supportPrice')}
                  </span>
                  <span className="text-white/70">{t('products.supportPeriod')}</span>
                </div>
                <CardDescription className="text-white/80 mt-2">
                  {t('products.supportDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-3">{t('products.supportFeatures')}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature1')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature2')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature3')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature4')}</span>
                    </li>
                    {FEATURE_TAX_DEDUCTION_UI && (
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.basicFeature5')}</span>
                    </li>
                    )}
                    <li className="flex items-start gap-2 text-white/80 mt-3 pt-3 border-t border-white/10">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.supportFeature1')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-white/80">
                      <Check className="h-5 w-5 text-electric-blue flex-shrink-0 mt-0.5" />
                      <span>{t('products.supportFeature2')}</span>
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={handleJoinNow}
                  className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t('products.buyNow')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center text-white/60 text-sm">
            <p>
              All prices are in EUR and include applicable taxes. Payment is processed securely through PAYCOMET and Stripe.
            </p>
            <p className="mt-2">
              For more information, please see our{' '}
              <a href="/terms-and-conditions" className="text-electric-blue hover:underline">
                Terms and Conditions
              </a>
              {' '}and{' '}
              <a href="/privacy-policy" className="text-electric-blue hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MembershipProducts;

