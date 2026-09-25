import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home } from "lucide-react";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { useNavigate } from "react-router-dom";

const SponsorSuccess = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Thank You | Sponsor Donation | Elektr-Âme"
        description="Thank you for supporting Elektr-Âme"
        url="https://www.elektr-ame.com/sponsor-success"
        keywords="sponsor, donation, thank you, Elektr-Âme"
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-xl">
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
              <p className="text-white/80 mb-6">
                {FEATURE_TAX_DEDUCTION_UI
                  ? "Your company's donation has been received. A tax deduction certificate will be sent to the contact email you provided, for use with your Impuesto de Sociedades declaration."
                  : "Your company's donation has been received. A confirmation will be sent to the contact email you provided."}
              </p>
              <Button
                onClick={() => navigate("/")}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SponsorSuccess;
