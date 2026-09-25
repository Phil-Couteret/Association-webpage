import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Euro, CreditCard, Loader2, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { useToast } from "@/hooks/use-toast";

const PRESET_AMOUNTS = [50, 100, 250, 500];

const Sponsor = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company_name: "",
    company_cif: "",
    company_address: "",
    contact_email: "",
    amount: "",
    message: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!formData.company_name.trim() || !formData.company_cif.trim() || !formData.contact_email.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name, CIF, and contact email are required",
        variant: "destructive",
      });
      return;
    }
    if (isNaN(amount) || amount < 20) {
      toast({
        title: "Validation Error",
        description: "Minimum donation amount is €20",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payment/sponsor-create-checkout.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company_name: formData.company_name.trim(),
          company_cif: formData.company_cif.trim(),
          company_address: formData.company_address.trim() || null,
          contact_email: formData.contact_email.trim(),
          amount,
          message: formData.message.trim() || null,
          logo_url: logoUrl || null,
        }),
      });
      const data = await response.json();
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Failed to create checkout");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to initiate donation",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SEO
        title="Support Us | Company Sponsorship | Elektr-Âme"
        description={
          FEATURE_TAX_DEDUCTION_UI
            ? "Support Elektr-Âme as a company. Make a tax-deductible donation and receive an official certificate for Impuesto de Sociedades."
            : "Support Elektr-Âme as a company with a donation to our association."
        }
        url="https://www.elektr-ame.com/sponsor"
        keywords={
          FEATURE_TAX_DEDUCTION_UI
            ? "sponsor, donation, company, Elektr-Âme, tax deduction, Impuesto de Sociedades"
            : "sponsor, donation, company, Elektr-Âme"
        }
      />
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          <Card className="bg-black/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Building2 className="h-8 w-8 text-electric-blue" />
                Support Elektr-Âme
              </CardTitle>
              <CardDescription className="text-white/80">
                {FEATURE_TAX_DEDUCTION_UI
                  ? "Companies can support our association with a tax-deductible donation. You will receive an official certificate for your Impuesto de Sociedades declaration."
                  : "Companies can support our association with a donation. Thank you for helping grow the community."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-white">Company name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Acme S.L."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_cif" className="text-white">CIF / NIF *</Label>
                  <Input
                    id="company_cif"
                    value={formData.company_cif}
                    onChange={(e) => setFormData({ ...formData, company_cif: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="B12345678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_address" className="text-white">Company address</Label>
                  <Input
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Carrer Example 123, 08001 Barcelona"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="text-white">Contact email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="contact@company.com"
                    required
                  />
                  {FEATURE_TAX_DEDUCTION_UI && (
                    <p className="text-white/50 text-xs">Tax receipt will be sent to this email</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Amount (€) *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {PRESET_AMOUNTS.map((a) => (
                      <Button
                        key={a}
                        type="button"
                        variant={formData.amount === String(a) ? "default" : "outline"}
                        size="sm"
                        className={formData.amount === String(a) ? "bg-electric-blue text-deep-purple" : "border-white/20 text-white"}
                        onClick={() => setFormData({ ...formData, amount: String(a) })}
                      >
                        €{a}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    min={20}
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Minimum €20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message (optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-white/10 border-white/20 text-white min-h-[80px]"
                    placeholder="A few words about your support..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Company logo (optional)</Label>
                  <p className="text-white/50 text-xs">
                    Your logo may appear in association communications as a sponsor. JPEG, PNG or WebP, max 2MB.
                  </p>
                  {logoUrl ? (
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10">
                      <img src={logoUrl} alt="Company logo" className="h-16 object-contain" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogoUrl(null)}
                        className="text-white/70 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-electric-blue file:text-deep-purple file:font-medium"
                        disabled={logoUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setLogoUploading(true);
                          try {
                            const fd = new FormData();
                            fd.append("logo", file);
                            const res = await fetch("/api/sponsor-logo-upload.php", {
                              method: "POST",
                              credentials: "include",
                              body: fd,
                            });
                            const data = await res.json();
                            if (data.success && data.url) {
                              setLogoUrl(data.url);
                            } else {
                              toast({
                                title: "Upload failed",
                                description: data.message || "Could not upload logo",
                                variant: "destructive",
                              });
                            }
                          } catch (err) {
                            toast({
                              title: "Upload failed",
                              description: err instanceof Error ? err.message : "Could not upload logo",
                              variant: "destructive",
                            });
                          } finally {
                            setLogoUploading(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      {logoUploading && <Loader2 className="h-4 w-4 animate-spin text-white/70" />}
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Donate with Card
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Sponsor;
