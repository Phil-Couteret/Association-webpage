import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirm_password: z.string().min(8, { message: "Password must be at least 8 characters" }),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInputs>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setErrorMessage(t('resetPassword.noToken'));
      setSubmitStatus('error');
    }
  }, [token, t]);

  const onSubmit = async (data: ResetPasswordInputs) => {
    if (!token) {
      setErrorMessage(t('resetPassword.noToken'));
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/password-reset-confirm.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          new_password: data.new_password,
        }),
      });

      const responseData = await response.json();

      if (responseData.success) {
        setSubmitStatus('success');
        toast({
          title: t('resetPassword.success'),
          description: t('resetPassword.successMessage'),
        });
        setTimeout(() => {
          navigate('/member-login');
        }, 3000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(responseData.message || t('resetPassword.error'));
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setSubmitStatus('error');
      setErrorMessage(t('resetPassword.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-purple via-black to-electric-blue pt-20 flex items-center justify-center">
      <SEO 
        title="Reset Password | Elektr-Âme"
        description="Set a new password for your Elektr-Âme member account."
        url="https://www.elektr-ame.com/reset-password"
        keywords="reset password, new password, account security, Elektr-Âme"
        robots="noindex, nofollow"
      />
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto bg-black/50 backdrop-blur-md border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">{t('resetPassword.title')}</CardTitle>
            <CardDescription className="text-white/70 text-lg">{t('resetPassword.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {submitStatus === 'success' && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  {t('resetPassword.successMessage')}
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {submitStatus !== 'success' && token && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-white">
                    {t('resetPassword.newPassword')} *
                  </Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...register('new_password')}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                  />
                  {errors.new_password && (
                    <p className="text-red-400 text-sm">{errors.new_password.message}</p>
                  )}
                  <p className="text-white/50 text-xs">{t('resetPassword.passwordRequirement')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-white">
                    {t('resetPassword.confirmPassword')} *
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...register('confirm_password')}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  />
                  {errors.confirm_password && (
                    <p className="text-red-400 text-sm">{errors.confirm_password.message}</p>
                  )}
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
                      <Lock className="mr-2 h-4 w-4" />
                      {t('resetPassword.submitButton')}
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="text-center text-white/70 text-sm">
              <p>
                <Link to="/member-login" className="text-electric-blue hover:underline">
                  {t('resetPassword.backToLogin')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

