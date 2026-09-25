import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const VerifyEmail = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState('');
  const [memberStatus, setMemberStatus] = useState('');
  const [verificationType, setVerificationType] = useState<'account' | 'email_change'>('account');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setError(t('verifyEmail.noToken'));
      return;
    }

    // Verify email
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/email-verify.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          const type = (data.verification_type as 'account' | 'email_change') || 'account';
          setVerificationType(type);

          if (type === 'email_change') {
            setVerified(true);
            setMemberStatus(data.member_status || '');
            setAlreadyVerified(false);
          } else if (data.already_verified) {
            setAlreadyVerified(true);
          } else {
            setVerified(true);
            setMemberStatus(data.member_status);
          }
        } else {
          setError(data.message || t('verifyEmail.error'));
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setError(t('verifyEmail.networkError'));
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, t]);

  const handleContinue = () => {
    if (verificationType === 'email_change') {
      navigate('/member-portal');
      return;
    }

    if (memberStatus === 'approved') {
      navigate('/member-login');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-purple via-black to-electric-blue pt-20 flex items-center justify-center">
      <SEO 
        title="Verify Email | Elektr-Âme"
        description="Verify your email address for your Elektr-Âme member account."
        url="https://www.elektr-ame.com/verify-email"
        keywords="email verification, verify account, Elektr-Âme"
        robots="noindex, nofollow"
      />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto bg-black/50 backdrop-blur-md border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">{t('verifyEmail.title')}</CardTitle>
            <CardDescription className="text-white/70 text-lg">{t('verifyEmail.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {verifying && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-electric-blue mx-auto mb-4" />
                <p className="text-white/70">{t('verifyEmail.verifying')}</p>
              </div>
            )}

            {!verifying && verified && (
              verificationType === 'email_change' ? (
                <>
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      {t('verifyEmail.emailChangeSuccess')}
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => navigate('/member-portal')}
                    className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                  >
                    {t('verifyEmail.emailChangeButton')}
                  </Button>
                </>
              ) : (
                <>
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      {t('verifyEmail.success')}
                    </AlertDescription>
                  </Alert>

                  {memberStatus === 'approved' && (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertDescription className="text-green-400">
                        {t('verifyEmail.canLogin')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {memberStatus === 'pending' && (
                    <Alert className="border-blue-500/50 bg-blue-500/10">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-400">
                        {t('verifyEmail.pendingApproval')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleContinue}
                    className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                  >
                    {memberStatus === 'approved' ? t('verifyEmail.loginButton') : t('verifyEmail.homeButton')}
                  </Button>
                </>
              )
            )}

            {!verifying && alreadyVerified && (
              <>
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <Mail className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-400">
                    {t('verifyEmail.alreadyVerified')}
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => navigate('/member-login')}
                  className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                >
                  {t('verifyEmail.loginButton')}
                </Button>
              </>
            )}

            {!verifying && error && (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/resend-verification')}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {t('verifyEmail.resendButton')}
                  </Button>

                  <div className="text-center text-white/70 text-sm">
                    <Link to="/" className="text-electric-blue hover:underline">
                      {t('verifyEmail.homeButton')}
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;

