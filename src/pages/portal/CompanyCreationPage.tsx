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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  FileText,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

// Multi-step form validation schemas
const step1Schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(
      /^\+\d{1,3}\d{4,14}$/,
      "Please enter a valid international phone number (e.g., +1234567890)"
    ),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  zipCode: z.string().min(4, "Zip code must be at least 4 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
});

const step2Schema = z.object({
  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters"),
  companyType: z.enum(
    ["LLC", "Corporation", "Partnership", "Sole Proprietorship", "Other"],
    {
      required_error: "Please select a company type",
    }
  ),
  businessActivity: z
    .string()
    .min(10, "Business activity description must be at least 10 characters")
    .max(500, "Business activity description must not exceed 500 characters"),
  jurisdiction: z.string().min(2, "Jurisdiction must be at least 2 characters"),
  shareCapital: z.string().optional(),
});

const step3Schema = z.object({
  additionalNotes: z.string().max(1000, "Notes must not exceed 1000 characters").optional(),
  urgency: z.enum(["low", "medium", "high"], {
    required_error: "Please select urgency level",
  }),
  hasConsultancyInquiry: z.boolean().optional(),
  consultancyInquiryId: z.string().optional(),
});

const companyCreationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema);

type CompanyCreationFormData = z.infer<typeof companyCreationSchema>;

const STEPS = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Company Details", icon: Building2 },
  { id: 3, title: "Additional Information", icon: FileText },
];

const CompanyCreationPage = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
    reset,
  } = useForm<CompanyCreationFormData>({
    resolver: zodResolver(companyCreationSchema),
    mode: "onChange",
    defaultValues: {
      urgency: "medium",
      hasConsultancyInquiry: false,
    },
  });

  const validateStep = async (step: number): Promise<boolean> => {
    let schema;
    switch (step) {
      case 1:
        schema = step1Schema;
        break;
      case 2:
        schema = step2Schema;
        break;
      case 3:
        schema = step3Schema;
        break;
      default:
        return false;
    }

    const fields = Object.keys(schema.shape);
    return await trigger(fields as any);
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: CompanyCreationFormData) => {
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/company-creation.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit company creation request");
      }

      setIsSuccess(true);
      reset();
      toast({
        title: "Company creation request submitted",
        description: "We'll process your request and contact you soon!",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <SEO 
          title="Company Creation Services | Elektr-Âme Portal"
          description="Professional company creation services for music professionals. Get help setting up your music business, record label, or production company in Spain."
          url="https://www.elektr-ame.com/portal/company-creation"
          keywords="company creation, business setup, record label, production company, music business, Spain, Barcelona"
          robots="noindex, nofollow"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Request Submitted Successfully!</h2>
              <p className="text-muted-foreground">
                Your company creation request has been received. Our team will
                review it and contact you within 2-3 business days.
              </p>
              <Button
                onClick={() => {
                  setIsSuccess(false);
                  setCurrentStep(1);
                  reset();
                }}
              >
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Company Creation Request</CardTitle>
          <CardDescription>
            Follow the steps below to request company formation services. This
            process typically follows a consultancy inquiry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : isCompleted
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-background border-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="mt-4" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="123 Main Street"
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">
                      Zip Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="zipCode"
                      {...register("zipCode")}
                      placeholder="10001"
                    />
                    {errors.zipCode && (
                      <p className="text-sm text-destructive">
                        {errors.zipCode.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="country"
                      {...register("country")}
                      placeholder="United States"
                    />
                    {errors.country && (
                      <p className="text-sm text-destructive">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Company Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    {...register("companyName")}
                    placeholder="My Company Ltd."
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyType">
                      Company Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue(
                          "companyType",
                          value as CompanyCreationFormData["companyType"]
                        )
                      }
                    >
                      <SelectTrigger id="companyType">
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LLC">LLC</SelectItem>
                        <SelectItem value="Corporation">Corporation</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Sole Proprietorship">
                          Sole Proprietorship
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.companyType && (
                      <p className="text-sm text-destructive">
                        {errors.companyType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction">
                      Jurisdiction <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="jurisdiction"
                      {...register("jurisdiction")}
                      placeholder="Delaware, USA"
                    />
                    {errors.jurisdiction && (
                      <p className="text-sm text-destructive">
                        {errors.jurisdiction.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shareCapital">Share Capital (Optional)</Label>
                  <Input
                    id="shareCapital"
                    {...register("shareCapital")}
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessActivity">
                    Business Activity Description{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="businessActivity"
                    {...register("businessActivity")}
                    placeholder="Describe the main business activities of your company..."
                    rows={5}
                  />
                  {errors.businessActivity && (
                    <p className="text-sm text-destructive">
                      {errors.businessActivity.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="urgency">
                    Urgency Level <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue(
                        "urgency",
                        value as CompanyCreationFormData["urgency"]
                      )
                    }
                    defaultValue="medium"
                  >
                    <SelectTrigger id="urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - No rush</SelectItem>
                      <SelectItem value="medium">Medium - Within 2-4 weeks</SelectItem>
                      <SelectItem value="high">High - Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.urgency && (
                    <p className="text-sm text-destructive">
                      {errors.urgency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="additionalNotes"
                    {...register("additionalNotes")}
                    placeholder="Any additional information or special requirements..."
                    rows={5}
                  />
                  {errors.additionalNotes && (
                    <p className="text-sm text-destructive">
                      {errors.additionalNotes.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyCreationPage;

