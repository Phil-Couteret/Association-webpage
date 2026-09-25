import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";

// Form validation schema
const joinUsSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  secondName: z.string().optional(),
  artistName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\+\d{1,3}\d{4,14}$/, "Please enter a valid international phone number (e.g., +1234567890)"),
  street: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms and conditions" }) }),
  newsletterSubscribe: z.boolean().optional(),
  isDj: z.boolean().optional(),
  isProducer: z.boolean().optional(),
  isVj: z.boolean().optional(),
  isVisualArtist: z.boolean().optional(),
  isFan: z.boolean().optional(),
});

type JoinUsFormData = z.infer<typeof joinUsSchema>;

const JoinUs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invite');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinUsFormData>({
    resolver: zodResolver(joinUsSchema),
    defaultValues: {
      newsletterSubscribe: true,
    },
  });

  const onSubmit = async (data: JoinUsFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const parseResponseJson = async (response: Response): Promise<Record<string, unknown> | null> => {
      const text = await response.text();
      if (!text.trim()) return {};
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        return null;
      }
    };

    try {
      const response = await fetch('/api/join-us.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({
          ...data,
          invite: invitationToken // Include invitation token if present
        }),
      });

      const responseData = await parseResponseJson(response);
      if (responseData === null) {
        setErrorMessage(
          t('joinUs.networkError')
        );
        setSubmitStatus('error');
        return;
      }

      if (response.ok) {
        setSubmitStatus('success');
        setTemporaryPassword(
          typeof responseData.temporary_password === 'string' ? responseData.temporary_password : ''
        );
        reset();
        setTimeout(() => {
          navigate('/member-portal');
        }, 8000);
        return;
      }

      if (responseData.code === 'DUPLICATE_EMAIL') {
        setErrorMessage(t('joinUs.errorDuplicateEmail'));
      } else {
        const msg = responseData.message;
        setErrorMessage(
          typeof msg === 'string' && msg.trim()
            ? msg
            : t('joinUs.error')
        );
      }
      setSubmitStatus('error');
    } catch {
      setErrorMessage(t('joinUs.networkError'));
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-purple via-black to-electric-blue pt-20 overflow-y-auto">
      <SEO 
        title="Join Us | Elektr-Âme"
        description="Join Elektr-Âme - Barcelona's electronic music association. Become a member and connect with artists, DJs, producers, and music lovers in Barcelona."
        url="https://www.elektr-ame.com/join-us"
        keywords="join, membership, Barcelona, electronic music, association, community"
      />
      <div className="container mx-auto px-4 py-8 pb-20">
        {/* Back button */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto">
          <Card className="bg-black/50 backdrop-blur-md border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                {t('joinUs.title')}
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                {t('joinUs.description')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Success message */}
              {submitStatus === 'success' && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400 space-y-2">
                    <p>{t('joinUs.success')}</p>
                    {temporaryPassword && (
                      <div className="mt-3 p-3 bg-black/30 rounded border border-green-500/30">
                        <p className="font-semibold mb-1">{t('joinUs.tempPasswordTitle')}</p>
                        <p className="font-mono text-lg text-white">{temporaryPassword}</p>
                        <p className="text-xs mt-2 text-green-300">{t('joinUs.tempPasswordNote')}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error message */}
              {submitStatus === 'error' && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    {t('joinUs.personalInfo')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">
                        {t('joinUs.firstName')} *
                      </Label>
                      <Input
                        id="firstName"
                        {...register('firstName')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={t('joinUs.firstNamePlaceholder')}
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-sm">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">
                        {t('joinUs.lastName')} *
                      </Label>
                      <Input
                        id="lastName"
                        {...register('lastName')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={t('joinUs.lastNamePlaceholder')}
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-sm">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondName" className="text-white">
                      {t('joinUs.secondName')} ({t('joinUs.optional')})
                    </Label>
                    <Input
                      id="secondName"
                      {...register('secondName')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('joinUs.secondNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artistName" className="text-white">
                      {t('joinUs.artistName')} ({t('joinUs.optional')})
                    </Label>
                    <Input
                      id="artistName"
                      {...register('artistName')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('joinUs.artistNamePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">
                      {t('joinUs.roles')} ({t('joinUs.optional')})
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <label className="flex items-center space-x-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/20 hover:border-electric-blue/50 transition-colors">
                        <input
                          type="checkbox"
                          {...register('isDj')}
                          className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                        />
                        <span className="text-sm text-white">DJ</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/20 hover:border-electric-blue/50 transition-colors">
                        <input
                          type="checkbox"
                          {...register('isProducer')}
                          className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                        />
                        <span className="text-sm text-white">{t('joinUs.producer')}</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/20 hover:border-electric-blue/50 transition-colors">
                        <input
                          type="checkbox"
                          {...register('isVj')}
                          className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                        />
                        <span className="text-sm text-white">VJ</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/20 hover:border-electric-blue/50 transition-colors">
                        <input
                          type="checkbox"
                          {...register('isVisualArtist')}
                          className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                        />
                        <span className="text-sm text-white">{t('joinUs.visualArtist')}</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer bg-white/5 p-3 rounded-lg border border-white/20 hover:border-electric-blue/50 transition-colors">
                        <input
                          type="checkbox"
                          {...register('isFan')}
                          className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                        />
                        <span className="text-sm text-white">{t('joinUs.fan')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    {t('joinUs.contactInfo')}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      {t('joinUs.email')} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('joinUs.emailPlaceholder')}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      {t('joinUs.phone')} *
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('joinUs.phonePlaceholder')}
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm">{errors.phone.message}</p>
                    )}
                    <p className="text-white/60 text-sm">
                      {t('joinUs.phoneHelp')}
                    </p>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    {t('joinUs.addressInfo')}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-white">
                      {t('joinUs.street')} ({t('joinUs.optional')})
                    </Label>
                    <Input
                      id="street"
                      {...register('street')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('joinUs.streetPlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-white">
                        {t('joinUs.zipCode')} ({t('joinUs.optional')})
                      </Label>
                      <Input
                        id="zipCode"
                        {...register('zipCode')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={t('joinUs.zipCodePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-white">
                        {t('joinUs.city')} *
                      </Label>
                      <Input
                        id="city"
                        {...register('city')}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={t('joinUs.cityPlaceholder')}
                      />
                      {errors.city && (
                        <p className="text-red-400 text-sm">{errors.city.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">
                      {t('joinUs.country')} *
                    </Label>
                    <Input
                      id="country"
                      {...register('country')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder={t('joinUs.countryPlaceholder')}
                    />
                    {errors.country && (
                      <p className="text-red-400 text-sm">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                {/* Newsletter opt-in */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('newsletterSubscribe')}
                      className="mt-1 rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                    />
                    <span className="text-white/90 text-sm">
                      {t('joinUs.newsletterSubscribe')}
                    </span>
                  </label>
                </div>

                {/* Terms acceptance */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('acceptTerms')}
                      className="mt-1 rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                    />
                    <span className="text-white/90 text-sm">
                      {t('joinUs.acceptTerms')}{' '}
                      <Link to="/terms-and-conditions" className="text-electric-blue hover:underline" target="_blank">
                        {t('joinUs.termsLink')}
                      </Link>
                      {' '}{t('joinUs.and')}{' '}
                      <Link to="/privacy-policy" className="text-electric-blue hover:underline" target="_blank">
                        {t('joinUs.privacyLink')}
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-red-400 text-sm">{errors.acceptTerms.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-electric-blue hover:bg-electric-blue/80 text-deep-purple font-semibold py-3 text-lg"
                  >
                    {isSubmitting 
                      ? t('joinUs.submitting') 
                      : t('joinUs.submit')
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JoinUs;


