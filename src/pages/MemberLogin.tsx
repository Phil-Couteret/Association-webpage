import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogIn, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useMemberSession } from "@/contexts/MemberSessionContext";

const MemberLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { memberSession, isLoading: memberSessionLoading, refresh } = useMemberSession();

  useEffect(() => {
    if (!memberSessionLoading && memberSession) {
      navigate("/member-portal", { replace: true });
    }
  }, [memberSessionLoading, memberSession, navigate]);

  if (memberSessionLoading || memberSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-deep-purple via-deep-purple/95 to-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-electric-blue" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/member-login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('memberLogin.loginSuccess'),
          description: t('memberLogin.welcomeBack'),
        });

        await refresh();
        navigate("/member-portal");
      } else {
        setError(data.message || t('memberLogin.loginFailed'));
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(t('memberLogin.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-purple via-deep-purple/95 to-black">
      <SEO 
        title="Member Login | Elektr-Âme"
        description="Login to your Elektr-Âme member account. Access your member portal, manage your profile, and stay connected with the community."
        url="https://www.elektr-ame.com/member-login"
        keywords="member login, Elektr-Âme, member portal, Barcelona, electronic music"
      />
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="bg-black/40 border-white/10 backdrop-blur">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-electric-blue/20 rounded-full">
                  <UserCircle className="h-12 w-12 text-electric-blue" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-white">
                {t('memberLogin.title')}
              </CardTitle>
              <CardDescription className="text-center text-white/70">
                {t('memberLogin.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    {t('memberLogin.emailLabel')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('memberLogin.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    {t('memberLogin.passwordLabel')}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('memberLogin.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-electric-blue hover:bg-electric-blue/90 text-deep-purple"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t('memberLogin.loginButton')}
                    </>
                  )}
                </Button>

                <div className="text-center space-y-2 pt-4">
                  <p className="text-sm text-white/60">
                    {t('memberLogin.noAccount')}{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/join-us")}
                      className="text-electric-blue hover:underline"
                    >
                      {t('memberLogin.joinNow')}
                    </button>
                  </p>
                  <p>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-electric-blue hover:underline"
                    >
                      {t('memberLogin.forgotPassword')}
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MemberLogin;

