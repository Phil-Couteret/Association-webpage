import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function isValidMixUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const openCallSchema = z.object({
  email: z.string().email(),
  whatsapp: z.string().min(6).max(48),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  djName: z.string().min(2),
  musicalStyle: z.string().min(3),
  mixLink: z.string().optional(),
  promoConsent: z.boolean().refine((v) => v === true),
});

type OpenCallFormData = z.infer<typeof openCallSchema>;

function canPreviewMixInBrowser(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".zip")) return false;
  const ext = lower.split(".").pop() || "";
  return ["mp3", "wav", "flac", "m4a", "aiff", "aif", "ogg", "opus", "webm", "aac"].includes(ext);
}

function isZipMixFile(file: File): boolean {
  return file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");
}

const OpenCallDj = () => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mixFile, setMixFile] = useState<File | null>(null);
  const [mixPreviewUrl, setMixPreviewUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // SPA navigation does not reset scroll; land at the top so the form title is visible.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (!mixFile || !canPreviewMixInBrowser(mixFile)) {
      setMixPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(mixFile);
    setMixPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [mixFile]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<OpenCallFormData>({
    resolver: zodResolver(openCallSchema),
    defaultValues: { mixLink: "", promoConsent: false },
  });

  const promoConsent = watch("promoConsent");

  const onSubmit = async (data: OpenCallFormData) => {
    setSubmitStatus("idle");
    setErrorMessage("");

    const linkTrim = data.mixLink?.trim() ?? "";
    const hasLink = linkTrim.length > 0;
    if (hasLink && !isValidMixUrl(linkTrim)) {
      setErrorMessage(t("openCall.mixLinkInvalid"));
      setSubmitStatus("error");
      return;
    }
    if (!hasLink && !mixFile) {
      setErrorMessage(t("openCall.mixRequired"));
      setSubmitStatus("error");
      return;
    }
    if (mixFile && mixFile.size > MAX_FILE_BYTES) {
      setErrorMessage(t("openCall.fileTooLarge"));
      setSubmitStatus("error");
      return;
    }
    if (photoFile && photoFile.size > MAX_PHOTO_BYTES) {
      setErrorMessage(t("openCall.photoTooLarge"));
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("email", data.email.trim());
      fd.append("whatsapp", data.whatsapp.trim());
      fd.append("first_name", data.firstName.trim());
      fd.append("last_name", data.lastName.trim());
      fd.append("dj_name", data.djName.trim());
      fd.append("musical_style", data.musicalStyle.trim());
      fd.append("promo_consent", "1");
      if (hasLink) {
        fd.append("mix_link", linkTrim);
      }
      if (mixFile) {
        fd.append("mix_file", mixFile);
      }
      if (photoFile) {
        fd.append("photo_file", photoFile);
      }

      const response = await fetch("/api/open-call-submit.php", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const json = await response.json().catch(() => ({}));
      if (response.ok && json.success) {
        setSubmitStatus("success");
        setErrorMessage("");
        reset({ mixLink: "", promoConsent: false });
        setMixFile(null);
        setMixPreviewUrl(null);
        setPhotoFile(null);
        if (photoInputRef.current) photoInputRef.current.value = "";
      } else {
        setErrorMessage(json.message || t("openCall.error"));
        setSubmitStatus("error");
      }
    } catch {
      setErrorMessage(t("openCall.networkError"));
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-purple via-black to-electric-blue flex flex-col">
      <SEO
        title={t("openCall.seoTitle")}
        description={t("openCall.seoDescription")}
        url="https://www.elektr-ame.com/open-call-dj"
        keywords="DJ, open call, Elektr-Âme, mix, electronic music"
      />
      <Header />

      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4 py-8 pb-20">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Link>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-black/50 backdrop-blur-md border-white/10">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  {t("openCall.title")}
                </CardTitle>
                <CardDescription className="text-white/80 text-lg">
                  {t("openCall.intro")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {submitStatus === "success" && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">{t("openCall.success")}</AlertDescription>
                  </Alert>
                )}

                {(submitStatus === "error" || errorMessage) && errorMessage && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">
                        {t("openCall.firstName")} *
                      </Label>
                      <Input
                        id="firstName"
                        className="bg-black/40 border-white/20 text-white"
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-400">Required</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">
                        {t("openCall.lastName")} *
                      </Label>
                      <Input
                        id="lastName"
                        className="bg-black/40 border-white/20 text-white"
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-400">Required</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="djName" className="text-white">
                      {t("openCall.djName")} *
                    </Label>
                    <Input
                      id="djName"
                      className="bg-black/40 border-white/20 text-white"
                      {...register("djName")}
                    />
                    {errors.djName && (
                      <p className="text-sm text-red-400">Required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      {t("openCall.email")} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="bg-black/40 border-white/20 text-white"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-400">Invalid email</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-white">
                      {t("openCall.whatsapp")} *
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+34 …"
                      className="bg-black/40 border-white/20 text-white"
                      {...register("whatsapp")}
                    />
                    {errors.whatsapp && (
                      <p className="text-sm text-red-400">Required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="musicalStyle" className="text-white">
                      {t("openCall.musicalStyle")} *
                    </Label>
                    <Textarea
                      id="musicalStyle"
                      rows={4}
                      placeholder={t("openCall.musicalStylePlaceholder")}
                      className="bg-black/40 border-white/20 text-white resize-y min-h-[100px]"
                      {...register("musicalStyle")}
                    />
                    {errors.musicalStyle && (
                      <p className="text-sm text-red-400">Required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photoFile" className="text-white">
                      {t("openCall.photo")}
                    </Label>
                    <Input
                      ref={photoInputRef}
                      id="photoFile"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                      className="bg-black/40 border-white/20 text-white file:mr-4 file:rounded file:border-0 file:bg-electric-blue/80 file:px-3 file:py-1 file:text-deep-purple"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPhotoFile(f ?? null);
                      }}
                    />
                    <p className="text-sm text-white/60">{t("openCall.photoHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mixLink" className="text-white">
                      {t("openCall.mixLink")}
                    </Label>
                    <Input
                      id="mixLink"
                      type="url"
                      placeholder={t("openCall.mixLinkPlaceholder")}
                      className="bg-black/40 border-white/20 text-white"
                      {...register("mixLink")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mixFile" className="text-white">
                      {t("openCall.mixFile")}
                    </Label>
                    <Input
                      id="mixFile"
                      type="file"
                      accept=".mp3,.wav,.flac,.m4a,.aiff,.aif,.ogg,.opus,.webm,.aac,.zip,audio/*,application/zip"
                      className="bg-black/40 border-white/20 text-white file:mr-4 file:rounded file:border-0 file:bg-electric-blue/80 file:px-3 file:py-1 file:text-deep-purple"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setMixFile(f ?? null);
                      }}
                    />
                    <p className="text-sm text-white/60">{t("openCall.mixFileHint")}</p>
                    {mixFile && mixPreviewUrl && (
                      <div className="rounded-lg border border-white/15 bg-black/30 p-4 space-y-2 mt-2">
                        <p className="text-sm text-electric-blue/90">{t("openCall.mixPreview")}</p>
                        <audio
                          key={mixPreviewUrl}
                          controls
                          className="w-full max-w-full h-10"
                          src={mixPreviewUrl}
                          preload="metadata"
                        />
                      </div>
                    )}
                    {mixFile && isZipMixFile(mixFile) && (
                      <p className="text-sm text-amber-200/90 mt-2">{t("openCall.mixPreviewZip")}</p>
                    )}
                  </div>

                  <div className="flex items-start gap-3 rounded-md border border-white/15 bg-black/20 p-4">
                    <Checkbox
                      id="promoConsent"
                      checked={!!promoConsent}
                      onCheckedChange={(c) => setValue("promoConsent", c === true, { shouldValidate: true })}
                      className="mt-1 border-white/40 data-[state=checked]:bg-electric-blue data-[state=checked]:text-deep-purple"
                    />
                    <Label htmlFor="promoConsent" className="text-sm text-white/90 font-normal leading-snug cursor-pointer">
                      {t("openCall.promoConsent")} *
                    </Label>
                  </div>
                  {errors.promoConsent && (
                    <p className="text-sm text-red-400 -mt-2">{t("openCall.promoConsentError")}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-electric-blue hover:bg-electric-blue/90 text-deep-purple font-semibold"
                  >
                    {isSubmitting ? t("openCall.submitting") : t("openCall.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OpenCallDj;
