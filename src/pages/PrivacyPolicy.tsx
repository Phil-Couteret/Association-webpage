import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <SEO 
        title={t('privacy.title')}
        description={t('privacy.description')}
        url="https://www.elektr-ame.com/privacy-policy"
        keywords="privacy policy, data protection, GDPR, Elektr-Âme"
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-3xl font-bold text-white">
                  {t('privacy.title')}
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
                  {t('privacy.intro')}
                </h2>
                <p>{t('privacy.introText')}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.dataController')}
                </h2>
                <p className="mb-2">{t('privacy.dataControllerText')}</p>
                <div className="space-y-2 ml-4">
                  <p><strong>{t('legal.commercialName')}:</strong> {t('legal.commercialNameValue')}</p>
                  <p><strong>{t('legal.identification')}:</strong> {t('legal.identificationValue')}</p>
                  <p><strong>{t('legal.address')}:</strong> {t('legal.addressValue')}</p>
                  <p><strong>{t('legal.email')}:</strong> {t('legal.emailValue')}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.dataCollection')}
                </h2>
                <p className="mb-2">{t('privacy.dataCollectionText')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataCollectionItem1')}</li>
                  <li>{t('privacy.dataCollectionItem2')}</li>
                  <li>{t('privacy.dataCollectionItem3')}</li>
                  <li>{t('privacy.dataCollectionItem4')}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.dataUse')}
                </h2>
                <p className="mb-2">{t('privacy.dataUseText')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataUseItem1')}</li>
                  <li>{t('privacy.dataUseItem2')}</li>
                  <li>{t('privacy.dataUseItem3')}</li>
                  <li>{t('privacy.dataUseItem4')}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.dataRetention')}
                </h2>
                <p>{t('privacy.dataRetentionText')}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.dataRights')}
                </h2>
                <p className="mb-2">{t('privacy.dataRightsText')}</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('privacy.dataRightsItem1')}</li>
                  <li>{t('privacy.dataRightsItem2')}</li>
                  <li>{t('privacy.dataRightsItem3')}</li>
                  <li>{t('privacy.dataRightsItem4')}</li>
                  <li>{t('privacy.dataRightsItem5')}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.cookies')}
                </h2>
                <p>{t('privacy.cookiesText')}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.security')}
                </h2>
                <p>{t('privacy.securityText')}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-3">
                  {t('privacy.contact')}
                </h2>
                <p>{t('privacy.contactText')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;

