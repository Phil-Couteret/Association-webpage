import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const resendSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type ResendInputs = z.infer<typeof resendSchema>;

const ResendVerification = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResendInputs>({
    resolver: zodResolver(resendSchema),
  });

  const onSubmit = async (data: ResendInputs) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/email-resend-verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (responseData.success) {
        setSubmitStatus('success');
        setMessage(responseData.message);
        reset();
      } else {
        setSubmitStatus('error');
        setMessage(responseData.message || t('resendVerification.error'));
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setSubmitStatus('error');
      setMessage(t('resendVerification.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-purple via-black to-electric-blue pt-20 flex items-center justify-center">
      <SEO 
        title="Resend Verification Email | Elektr-Âme"
        description="Resend email verification link for your Elektr-Âme member account."
        url="https://www.elektr-ame.com/resend-verification"
        keywords="resend verification, email verification, Elektr-Âme"
        robots="noindex, nofollow"
      />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto bg-black/50 backdrop-blur-md border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">{t('resendVerification.title')}</CardTitle>
            <CardDescription className="text-white/70 text-lg">{t('resendVerification.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submitStatus === 'success' && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">{message}</AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {submitStatus !== 'success' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">{t('resendVerification.emailLabel')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder={t('resendVerification.emailPlaceholder')}
                  />
                  {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      {t('resendVerification.submitButton')}
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="text-center text-white/70 text-sm space-y-2">
              <p>
                {t('resendVerification.alreadyVerified')}{' '}
                <Link to="/member-login" className="text-electric-blue hover:underline">
                  {t('resendVerification.loginLink')}
                </Link>
              </p>
              <p>
                {t('resendVerification.noAccount')}{' '}
                <Link to="/join-us" className="text-electric-blue hover:underline">
                  {t('resendVerification.joinLink')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResendVerification;

