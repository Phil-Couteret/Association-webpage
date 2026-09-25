import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { getTerms } from "content/terms";

const TermsAndConditions = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const terms = getTerms(language);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <SEO 
        title={terms.title}
        description={terms.description}
        url="https://www.elektr-ame.com/terms-and-conditions"
        keywords="terms and conditions, terms of service, purchase policy, refund policy, Elektr-Âme"
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-3xl font-bold text-white">
                  {terms.title}
                </CardTitle>
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-white/80">
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.acceptance}
                </h2>
                <p>{terms.acceptanceText}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.membership}
                </h2>
                <p>{terms.membershipText}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.purchasePolicy}
                </h2>
                <div className="space-y-3">
                  <p>{terms.purchasePolicyText}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{terms.purchasePolicyItem1}</li>
                    <li>{terms.purchasePolicyItem2}</li>
                    <li>{terms.purchasePolicyItem3}</li>
                    <li>{terms.purchasePolicyItem4}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.shippingPolicy}
                </h2>
                <div className="space-y-3">
                  <p>{terms.shippingPolicyText}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{terms.shippingPolicyItem1}</li>
                    <li>{terms.shippingPolicyItem2}</li>
                    <li>{terms.shippingPolicyItem3}</li>
                    {FEATURE_TAX_DEDUCTION_UI && <li>{terms.shippingPolicyItem4}</li>}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.returnsPolicy}
                </h2>
                <div className="space-y-3">
                  <p>{terms.returnsPolicyText}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{terms.returnsPolicyItem1}</li>
                    <li>{terms.returnsPolicyItem2}</li>
                    <li>{terms.returnsPolicyItem3}</li>
                    <li>{terms.returnsPolicyItem4}</li>
                  </ul>
                  <p className="mt-3">{terms.refundPolicyContact}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.refundPolicy}
                </h2>
                <div className="space-y-3">
                  <p>{terms.refundPolicyText}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{terms.refundPolicyItem1}</li>
                    <li>{terms.refundPolicyItem2}</li>
                    <li>{terms.refundPolicyItem3}</li>
                    <li>{terms.refundPolicyItem4}</li>
                  </ul>
                  <p className="mt-3">{terms.refundPolicyContact}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.payment}
                </h2>
                <p>{terms.paymentText}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.dataProtection}
                </h2>
                <p>{terms.dataProtectionText}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.modifications}
                </h2>
                <p>{terms.modificationsText}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {terms.contact}
                </h2>
                <p>{terms.contactText}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsAndConditions;

