import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

// Form validation schema
const consultancySchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(
      /^\+\d{1,3}\d{4,14}$/,
      "Please enter a valid international phone number (e.g., +1234567890)"
    ),
  companyName: z.string().optional(),
  inquiryType: z.enum(["general", "strategy", "legal", "financial", "other"], {
    required_error: "Please select an inquiry type",
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must not exceed 1000 characters"),
  preferredContactMethod: z.enum(["email", "phone", "both"]),
});

type ConsultancyFormData = z.infer<typeof consultancySchema>;

const ConsultancyPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ConsultancyFormData>({
    resolver: zodResolver(consultancySchema),
    defaultValues: {
      preferredContactMethod: "email",
    },
  });

  const inquiryType = watch("inquiryType");

  const onSubmit = async (data: ConsultancyFormData) => {
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/consultancy-inquiry.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit inquiry");
      }

      setIsSuccess(true);
      reset();
      toast({
        title: "Inquiry submitted successfully",
        description: "We'll get back to you soon!",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <SEO 
        title="Consultancy Services | Elektr-Âme Portal"
        description="Get professional consultancy services for your music business. Legal, financial, strategic, and general business advice for artists and music professionals in Barcelona."
        url="https://www.elektr-ame.com/portal/consultancy"
        keywords="music consultancy, business advice, legal advice, financial consulting, music industry, Barcelona, artists"
        robots="noindex, nofollow"
      />
      <Card>
        <CardHeader>
          <CardTitle>Consultancy Inquiry</CardTitle>
          <CardDescription>
            Get in touch with our experts for general business consultancy
            services. We're here to help you with your business needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your inquiry has been submitted successfully! We'll contact you
                soon.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+1234567890"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder="Your Company Ltd."
                />
              </div>
            </div>

            {/* Inquiry Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Inquiry Details</h3>
              <div className="space-y-2">
                <Label htmlFor="inquiryType">
                  Inquiry Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("inquiryType", value as ConsultancyFormData["inquiryType"])
                  }
                >
                  <SelectTrigger id="inquiryType">
                    <SelectValue placeholder="Select inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Consultation</SelectItem>
                    <SelectItem value="strategy">Business Strategy</SelectItem>
                    <SelectItem value="legal">Legal Advice</SelectItem>
                    <SelectItem value="financial">Financial Planning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.inquiryType && (
                  <p className="text-sm text-destructive">
                    {errors.inquiryType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  {...register("message")}
                  placeholder="Tell us about your business needs..."
                  rows={6}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod">
                  Preferred Contact Method
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue(
                      "preferredContactMethod",
                      value as ConsultancyFormData["preferredContactMethod"]
                    )
                  }
                  defaultValue="email"
                >
                  <SelectTrigger id="preferredContactMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Inquiry"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultancyPage;

