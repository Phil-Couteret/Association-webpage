
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContextNew";
import { MemberSessionProvider } from "@/contexts/MemberSessionContext";
import { PublicDataProvider } from "@/contexts/PublicDataContext";
import Index from "./pages/Index";
import Initiatives from "./pages/Initiatives";
import Contact from "./pages/Contact";
import JoinUs from "./pages/JoinUs";
import MemberLogin from "./pages/MemberLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ResendVerification from "./pages/ResendVerification";
import Admin from "./pages/Admin";
import MemberPortal from "./pages/MemberPortal";
import ArtistDetail from "./pages/ArtistDetail";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PortalLayout from "./components/portal/PortalLayout";
import ConsultancyPage from "./pages/portal/ConsultancyPage";
import CompanyCreationPage from "./pages/portal/CompanyCreationPage";
import MemberAreaLayout from "./components/portal/MemberAreaLayout";
import LegalNotice from "./pages/LegalNotice";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import MembershipProducts from "./pages/MembershipProducts";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import Sponsor from "./pages/Sponsor";
import SponsorSuccess from "./pages/SponsorSuccess";
import OpenCallDj from "./pages/OpenCallDj";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MemberSessionProvider>
        <LanguageProvider>
          <PublicDataProvider>
            <Toaster />
            <Sonner />
            <PWAInstallPrompt />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/initiatives" element={<Initiatives />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/legal-notice" element={<LegalNotice />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/membership" element={<MembershipProducts />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentFailure />} />
              <Route path="/sponsor" element={<Sponsor />} />
              <Route path="/sponsor-success" element={<SponsorSuccess />} />
              <Route path="/open-call-dj" element={<OpenCallDj />} />
              <Route path="/join-us" element={<JoinUs />} />
              <Route path="/member-login" element={<MemberLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="/member-portal" element={<MemberAreaLayout />} />
              <Route path="/artist/:id" element={<ArtistDetail />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              {/* Portal Routes */}
              <Route path="/portal" element={<PortalLayout />}>
                <Route index element={<Navigate to="/portal/consultancy" replace />} />
                <Route path="consultancy" element={<ConsultancyPage />} />
                <Route path="company-creation" element={<CompanyCreationPage />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </PublicDataProvider>
        </LanguageProvider>
        </MemberSessionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
