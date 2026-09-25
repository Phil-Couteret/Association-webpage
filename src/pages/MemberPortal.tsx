import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  User, 
  CreditCard, 
  Download, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin,
  Building2,
  Edit,
  QrCode,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Save,
  X as CloseIcon,
  RefreshCw,
  LogOut,
  Lock,
  UserPlus,
  Users
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import MemberCard from "@/components/MemberCard";
import PaymentHistory from "@/components/portal/PaymentHistory";
import MemberStats from "@/components/portal/MemberStats";
import PaymentCheckout from "@/components/payment/PaymentCheckout";
import MembershipRenewal from "@/components/payment/MembershipRenewal";
import PaymentAllocation from "@/components/payment/PaymentAllocation";
import TermsAcceptance from "@/components/portal/TermsAcceptance";
import { Switch } from "@/components/ui/switch";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";

interface PendingEmailChange {
  new_email: string;
  requested_at?: string;
  expires_at?: string;
}

interface MemberData {
  id: number;
  email: string;
  first_name: string;
  second_name: string;
  artist_name?: string;
  profile_picture?: string;
  bio?: string;
  social_links?: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
    youtube?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  status: 'pending' | 'approved' | 'rejected';
  membership_type: 'in_progress' | 'yearly' | 'lifetime';
  membership_start_date?: string;
  membership_end_date?: string;
  payment_status: 'unpaid' | 'paid' | 'overdue';
  is_dj: boolean;
  is_producer: boolean;
  is_vj: boolean;
  is_visual_artist: boolean;
  is_fan: boolean;
  newsletter_subscribe?: boolean;
  company_name?: string | null;
  company_cif?: string | null;
  company_address?: string | null;
  created_at: string;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  pending_email_change?: PendingEmailChange;
}

const MemberPortal = () => {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  // On mobile, default to card tab so QR is visible immediately (avoids tab-switch rendering issues)
  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "card" : "overview"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    second_name: '',
    artist_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    company_name: '',
    company_cif: '',
    company_address: '',
    bio: '',
    newsletter_subscribe: true,
    social_links: {
      instagram: '',
      soundcloud: '',
      spotify: '',
      youtube: '',
      facebook: '',
      twitter: '',
      website: ''
    }
  });
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [inviteFormData, setInviteFormData] = useState({
    first_name: '',
    email: ''
  });
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [invitedMembers, setInvitedMembers] = useState<any[]>([]);
  const [invitedMembersLoading, setInvitedMembersLoading] = useState(true);
  const [updatingNewsletter, setUpdatingNewsletter] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMemberData();
    fetchInvitations();
    fetchInvitedMembers();
  }, []);

  // Refresh invitations and invited members when sponsorship tab is opened
  useEffect(() => {
    if (activeTab === 'sponsorship') {
      fetchInvitations();
      fetchInvitedMembers();
    }
  }, [activeTab]);

  const fetchMemberData = async () => {
    try {
      const response = await fetch('/api/member-profile.php', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success && data.member) {
        setMemberData(data.member);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load member data",
          variant: "destructive",
        });
        // Redirect to login or join page
        navigate('/join-us');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      navigate('/join-us');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const getMembershipTypeBadge = (type: string) => {
    const types = {
      in_progress: { label: t('portal.membership.inProgress'), color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
      yearly: { label: t('portal.membership.yearly'), color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      lifetime: { label: t('portal.membership.lifetime'), color: 'bg-gold-500/20 text-yellow-400 border-yellow-500/50' },
    };
    const typeInfo = types[type as keyof typeof types] || types.in_progress;
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Overdue</Badge>;
      default:
        return null;
    }
  };

  const getRoles = () => {
    if (!memberData) return [];
    const roles = [];
    if (memberData.is_dj) roles.push('DJ');
    if (memberData.is_producer) roles.push('Producer');
    if (memberData.is_vj) roles.push('VJ');
    if (memberData.is_visual_artist) roles.push('Visual Artist');
    if (memberData.is_fan) roles.push('Fan');
    return roles;
  };

  const downloadMemberCard = () => {
    toast({
      title: "Coming Soon",
      description: "Digital card download will be available soon!",
    });
  };

  const startEditing = () => {
    if (memberData) {
      // If there's a pending email change, use the new email in the form
      // Otherwise use the current email
      const emailToShow = memberData.pending_email_change?.new_email || memberData.email;
      
      setEditFormData({
        first_name: memberData.first_name,
        second_name: memberData.second_name,
        artist_name: memberData.artist_name || '',
        email: emailToShow,
        phone: memberData.phone || '',
        address: memberData.address || '',
        city: memberData.city || '',
        postal_code: memberData.postal_code || '',
        country: memberData.country || '',
        company_name: memberData.company_name || '',
        company_cif: memberData.company_cif || '',
        company_address: memberData.company_address || '',
        bio: memberData.bio || '',
        newsletter_subscribe: memberData.newsletter_subscribe ?? true,
        social_links: memberData.social_links || {
          instagram: '',
          soundcloud: '',
          spotify: '',
          youtube: '',
          facebook: '',
          twitter: '',
          website: ''
        }
      });
      setIsEditing(true);
    }
  };

  const handleNewsletterToggle = async (checked: boolean) => {
    if (!memberData) return;
    setUpdatingNewsletter(true);
    try {
      const response = await fetch('/api/member-profile-update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: memberData.first_name,
          second_name: memberData.second_name ?? '',
          email: memberData.email,
          artist_name: memberData.artist_name || '',
          phone: memberData.phone || '',
          address: memberData.address || '',
          city: memberData.city || '',
          postal_code: memberData.postal_code || '',
          country: memberData.country || '',
          bio: memberData.bio || '',
          social_links: memberData.social_links || {},
          newsletter_subscribe: checked,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMemberData({ ...memberData, newsletter_subscribe: checked });
        toast({
          title: t('portal.profile.updateSuccess'),
          description: checked ? t('portal.profile.newsletterSubscribed') : t('portal.profile.newsletterNotSubscribed'),
        });
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error) {
      toast({
        title: t('portal.profile.updateError'),
        description: error instanceof Error ? error.message : t('portal.profile.updateErrorMessage'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingNewsletter(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData({
      first_name: '',
      second_name: '',
      artist_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: '',
      company_name: '',
      company_cif: '',
      company_address: '',
      bio: '',
      newsletter_subscribe: true,
      social_links: {
        instagram: '',
        soundcloud: '',
        spotify: '',
        youtube: '',
        facebook: '',
        twitter: '',
        website: ''
      }
    });
  };

  const handleProfilePictureUpload = async (file: File) => {
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch('/api/member-profile-picture-upload.php', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Failed to upload profile picture';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Profile picture uploaded successfully',
        });
        // Reload member data to get updated profile picture
        fetchMemberData();
      } else {
        throw new Error(data.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setUploadingPicture(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/member-profile-update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...editFormData,
          social_links: editFormData.social_links,
          company_name: editFormData.company_name || null,
          company_cif: editFormData.company_cif || null,
          company_address: editFormData.company_address || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const pendingChange = data.pending_email_change;
        if (pendingChange) {
          toast({
            title: t('portal.profile.emailChangeConfirmationSent'),
            description: t('portal.profile.emailChangeConfirmationSentDescription', { email: pendingChange.new_email }),
          });
        } else {
          toast({
            title: t('portal.profile.updateSuccess'),
            description: t('portal.profile.updateSuccessMessage'),
          });
        }

        setIsEditing(false);
        // Refresh member data
        fetchMemberData();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (error) {
      toast({
        title: t('portal.profile.updateError'),
        description: error instanceof Error ? error.message : t('portal.profile.updateErrorMessage'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenewal = () => {
    toast({
      title: t('portal.renewal.comingSoon'),
      description: t('portal.renewal.comingSoonMessage'),
    });
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/member-logout.php', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('portal.logout.success'),
          description: t('portal.logout.goodbye'),
        });
        navigate('/');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, redirect to home
      navigate('/');
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast({
        title: t('portal.changePassword.error'),
        description: t('portal.changePassword.allFieldsRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: t('portal.changePassword.error'),
        description: t('portal.changePassword.passwordsMustMatch'),
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast({
        title: t('portal.changePassword.error'),
        description: t('portal.changePassword.passwordTooShort'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/member-change-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('portal.changePassword.success'),
          description: t('portal.changePassword.successMessage'),
        });
        // Clear form
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setIsChangingPassword(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: t('portal.changePassword.error'),
        description: error instanceof Error ? error.message : t('portal.changePassword.errorMessage'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMembershipStatus = () => {
    if (!memberData?.membership_end_date) return null;
    const expiryDate = new Date(memberData.membership_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring_soon', days: daysUntilExpiry };
    } else {
      return { status: 'active', days: daysUntilExpiry };
    }
  };

  const isExpiringSoon = () => {
    const membershipStatus = getMembershipStatus();
    return membershipStatus && (membershipStatus.status === 'expiring_soon' || membershipStatus.status === 'expired');
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const response = await fetch('/api/invitations-list.php', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setInvitations(data.invitations || []);
      } else {
        console.error('Failed to fetch invitations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const fetchInvitedMembers = async () => {
    setInvitedMembersLoading(true);
    try {
      const response = await fetch('/api/members-get-invited.php', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setInvitedMembers(data.invited_members || []);
      } else {
        console.error('Failed to fetch invited members:', data.error);
      }
    } catch (error) {
      console.error('Error fetching invited members:', error);
    } finally {
      setInvitedMembersLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteFormData.first_name || !inviteFormData.email) {
      toast({
        title: t('portal.sponsorship.error.notEligible'),
        description: t('portal.sponsorship.inviteForm.firstName') + ' and ' + t('portal.sponsorship.inviteForm.email') + ' are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingInvitation(true);
    try {
      const response = await fetch('/api/invitations-create.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          first_name: inviteFormData.first_name,
          email: inviteFormData.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('portal.sponsorship.success.invitationSent'),
          description: t('portal.sponsorship.inviteForm.firstName') + ': ' + inviteFormData.first_name,
        });
        setInviteFormData({ first_name: '', email: '' });
        fetchInvitations();
      } else {
        let errorMessage = data.error || 'Failed to send invitation';
        if (errorMessage.includes('already sent')) {
          errorMessage = t('portal.sponsorship.error.alreadyInvited');
        } else if (errorMessage.includes('already registered')) {
          errorMessage = t('portal.sponsorship.error.alreadyMember');
        } else if (errorMessage.includes('approved member with paid membership')) {
          errorMessage = t('portal.sponsorship.error.notEligible');
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingInvitation(false);
    }
  };

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">{t('portal.sponsorship.status.sent')}</Badge>;
      case 'registered':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">{t('portal.sponsorship.status.registered')}</Badge>;
      case 'payed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">{t('portal.sponsorship.status.payed')}</Badge>;
      case 'approved':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">{t('portal.sponsorship.status.approved')}</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-light animate-spin" />
      </div>
    );
  }

  if (!memberData) {
    return null;
  }

  const pendingEmailChange = memberData.pending_email_change;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-12">
      <SEO 
        title="Member Portal | Elektr-Âme"
        description="Access your Elektr-Âme member portal. Manage your profile, view membership details, and stay connected with the community."
        url="https://www.elektr-ame.com/member-portal"
        keywords="member portal, member account, Elektr-Âme, membership"
        robots="noindex, nofollow"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header - Hidden when nested in MemberAreaLayout */}
        <div className="mb-8 hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {t('portal.title')}
              </h1>
              <p className="text-white/70">
                {t('portal.welcomeBack', { name: memberData.first_name })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {t('portal.backToHome')}
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('portal.logout.button')}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Status</p>
                  {getStatusBadge(memberData.status)}
                </div>
                <User className="h-10 w-10 text-blue-light" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Membership</p>
                  {getMembershipTypeBadge(memberData.membership_type)}
                </div>
                <CreditCard className="h-10 w-10 text-blue-light" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Payment</p>
                  {getPaymentStatusBadge(memberData.payment_status)}
                </div>
                <CheckCircle className="h-10 w-10 text-blue-light" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-black/40 border-white/10">
            <TabsTrigger value="overview">{t('portal.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="card">{t('portal.tabs.card')}</TabsTrigger>
            <TabsTrigger value="profile">{t('portal.tabs.profile')}</TabsTrigger>
            <TabsTrigger value="payments">{t('portal.tabs.payments')}</TabsTrigger>
            <TabsTrigger value="sponsorship">{t('portal.tabs.sponsorship')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Terms and Conditions - set only when member has paid (Stripe, cash, wire, paycomet, other) */}
            <TermsAcceptance
              termsAcceptedAt={memberData.terms_accepted_at}
              paymentStatus={memberData.payment_status}
              onAccepted={fetchMemberData}
              onGoToPayments={() => setActiveTab('payments')}
            />

            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-light" />
                  Membership Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Member ID</p>
                    <p className="text-white font-mono">EA-{String(memberData.id).padStart(6, '0')}</p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Member Since</p>
                    <p className="text-white">{new Date(memberData.created_at).toLocaleDateString()}</p>
                  </div>
                  {memberData.membership_start_date && (
                    <div>
                      <p className="text-white/70 text-sm mb-1">Membership Start</p>
                      <p className="text-white">{new Date(memberData.membership_start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {memberData.membership_end_date && (
                    <div>
                      <p className="text-white/70 text-sm mb-1">Membership Expires</p>
                      <p className="text-white">{new Date(memberData.membership_end_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {getRoles().length > 0 && (
                  <div>
                    <p className="text-white/70 text-sm mb-2">Roles</p>
                    <div className="flex flex-wrap gap-2">
                      {getRoles().map((role) => (
                        <Badge key={role} className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {memberData.status === 'approved' && memberData.payment_status !== 'overdue' && (
                  <div className="pt-4 border-t border-white/10">
                    <Button
                      className="w-full bg-blue-medium hover:bg-blue-dark text-white"
                      onClick={downloadMemberCard}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Membership Card
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Membership Status & Renewal Reminder */}
            {(() => {
              const membershipStatus = getMembershipStatus();
              if (!membershipStatus) return null;

              if (membershipStatus.status === 'expired') {
                return (
                  <Card className="bg-red-500/10 border-red-500/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">Membership Expired</h3>
                          <p className="text-white/70 text-sm mb-2">
                            Your membership expired {membershipStatus.days} day{membershipStatus.days !== 1 ? 's' : ''} ago on {memberData.membership_end_date ? new Date(memberData.membership_end_date).toLocaleDateString() : ''}.
                          </p>
                          <p className="text-white/60 text-xs mb-4">
                            Renew your membership to continue enjoying all member benefits.
                          </p>
                          <Button
                            onClick={() => setActiveTab('payments')}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renew Membership
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              if (membershipStatus.status === 'expiring_soon') {
                return (
                  <Card className="bg-orange-500/10 border-orange-500/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-orange-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-semibold">Membership Expiring Soon</h3>
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                              {membershipStatus.days} day{membershipStatus.days !== 1 ? 's' : ''} left
                            </Badge>
                          </div>
                          <p className="text-white/70 text-sm mb-2">
                            Your membership expires on <strong>{memberData.membership_end_date ? new Date(memberData.membership_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</strong>.
                          </p>
                          <p className="text-white/60 text-xs mb-4">
                            Renew now to continue enjoying all member benefits without interruption.
                          </p>
                          <Button
                            onClick={() => setActiveTab('payments')}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Renew Membership
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Active membership with countdown
              return (
                <Card className="bg-green-500/10 border-green-500/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">Membership Active</h3>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            {membershipStatus.days} day{membershipStatus.days !== 1 ? 's' : ''} remaining
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm">
                          Your membership is active until <strong>{memberData.membership_end_date ? new Date(memberData.membership_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</strong>.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })(            )}

            {memberData.status === 'pending' && (
              <Card className="bg-yellow-500/10 border-yellow-500/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">{t('portal.overview.pending.title')}</h3>
                      <p className="text-white/70 text-sm">
                        {t('portal.overview.pending.message')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Member Statistics */}
            {memberData.status === 'approved' && (
              <div className="mt-6">
                <MemberStats />
              </div>
            )}
          </TabsContent>

          {/* Digital Card Tab */}
          <TabsContent value="card" className="mt-6">
            {memberData.status === 'approved' ? (
              <MemberCard
                memberId={memberData.id}
                firstName={memberData.first_name}
                secondName={memberData.second_name}
                artistName={memberData.artist_name}
                membershipType={memberData.membership_type}
                status={memberData.status}
                memberSince={memberData.created_at}
                expiryDate={memberData.membership_end_date}
              />
            ) : (
              <Card className="bg-black/40 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-light" />
                    Digital Membership Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-32 w-32 text-yellow-400 mb-6" />
                    <p className="text-white text-center mb-4 text-lg font-semibold">
                      Card Not Available
                    </p>
                    <p className="text-white/70 text-center max-w-md">
                      Your digital membership card will be available once your membership is approved.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-light" />
                    {t('portal.profile.title')}
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={startEditing}
                      variant="outline"
                      size="sm"
                      className="border-blue-light text-blue-light hover:bg-blue-light/10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('portal.profile.editProfile')}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isEditing ? (
                  /* View Mode */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <Mail className="h-5 w-5 text-white/50" />
                      <div className="flex-1">
                        <p className="text-white/70 text-sm">{t('portal.profile.email')}</p>
                        <p className="text-white">{memberData.email}</p>
                      </div>
                    </div>

                    {pendingEmailChange && (
                      <div className="pb-4 border-b border-white/10">
                        <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-100">
                          <AlertTitle className="text-yellow-200">
                            {t('portal.profile.pendingEmailChange.title')}
                          </AlertTitle>
                          <AlertDescription className="text-yellow-100 text-sm">
                            {pendingEmailChange.expires_at
                              ? t('portal.profile.pendingEmailChange.message', {
                                  email: pendingEmailChange.new_email,
                                  date: new Date(pendingEmailChange.expires_at).toLocaleString(),
                                })
                              : t('portal.profile.pendingEmailChange.messageNoDate', {
                                  email: pendingEmailChange.new_email,
                                })}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <User className="h-5 w-5 text-white/50" />
                      <div className="flex-1">
                        <p className="text-white/70 text-sm">{t('portal.profile.name')}</p>
                        <p className="text-white">{memberData.first_name} {memberData.second_name}</p>
                        {memberData.artist_name && (
                          <p className="text-blue-light text-sm">{t('portal.profile.artist')}: {memberData.artist_name}</p>
                        )}
                      </div>
                    </div>

                    {memberData.phone && (
                      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                        <Phone className="h-5 w-5 text-white/50" />
                        <div className="flex-1">
                          <p className="text-white/70 text-sm">{t('portal.profile.phone')}</p>
                          <p className="text-white">{memberData.phone}</p>
                        </div>
                      </div>
                    )}

                    {(memberData.address || memberData.city || memberData.country) && (
                      <div className="flex items-start gap-3 pb-4 border-b border-white/10">
                        <MapPin className="h-5 w-5 text-white/50 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-white/70 text-sm">{t('portal.profile.address')}</p>
                          <p className="text-white">
                            {memberData.address && <>{memberData.address}<br /></>}
                            {memberData.city && <>{memberData.city} </>}
                            {memberData.postal_code && <>{memberData.postal_code}<br /></>}
                            {memberData.country}
                          </p>
                        </div>
                      </div>
                    )}

                    {(memberData.company_name || memberData.company_cif) && (
                      <div className="flex items-start gap-3 pb-4 border-b border-white/10">
                        <Building2 className="h-5 w-5 text-white/50 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-white/70 text-sm">
                            {FEATURE_TAX_DEDUCTION_UI ? "Company (for tax receipt)" : "Company"}
                          </p>
                          <p className="text-white">
                            {memberData.company_name}
                            {memberData.company_cif && <><br />CIF: {memberData.company_cif}</>}
                            {memberData.company_address && <><br />{memberData.company_address}</>}
                          </p>
                          {FEATURE_TAX_DEDUCTION_UI && (
                            <p className="text-white/50 text-xs mt-1">
                              You can choose to issue the tax receipt to this company when paying.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Newsletter preference - inline toggle */}
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3 flex-1">
                        <Mail className="h-5 w-5 text-white/50" />
                        <div>
                          <p className="text-white/70 text-sm">{t('portal.profile.newsletter')}</p>
                          <p className="text-white text-sm">
                            {memberData.newsletter_subscribe
                              ? t('portal.profile.newsletterSubscribed')
                              : t('portal.profile.newsletterNotSubscribed')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">
                          {memberData.newsletter_subscribe ? t('portal.profile.newsletterOn') : t('portal.profile.newsletterOff')}
                        </span>
                        <Switch
                          checked={!!memberData.newsletter_subscribe}
                          onCheckedChange={handleNewsletterToggle}
                          disabled={updatingNewsletter}
                          className="data-[state=checked]:bg-electric-blue"
                        />
                      </div>
                    </div>

                    {/* Profile Picture */}
                    <div className="pb-4 border-b border-white/10">
                      <p className="text-white/70 text-sm mb-3">Profile Picture</p>
                      {memberData.profile_picture ? (
                        <div className="flex items-center gap-4">
                          <img 
                            src={memberData.profile_picture} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                          <User className="h-12 w-12 text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {memberData.bio && (
                      <div className="pb-4 border-b border-white/10">
                        <p className="text-white/70 text-sm mb-2">Bio</p>
                        <p className="text-white whitespace-pre-wrap">{memberData.bio}</p>
                      </div>
                    )}

                    {/* Social Links */}
                    {memberData.social_links && Object.keys(memberData.social_links).some(key => memberData.social_links![key]) && (
                      <div className="pb-4 border-b border-white/10">
                        <p className="text-white/70 text-sm mb-3">Social Links</p>
                        <div className="flex flex-wrap gap-2">
                          {memberData.social_links.instagram && (
                            <a href={memberData.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              Instagram
                            </a>
                          )}
                          {memberData.social_links.soundcloud && (
                            <a href={memberData.social_links.soundcloud} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              SoundCloud
                            </a>
                          )}
                          {memberData.social_links.spotify && (
                            <a href={memberData.social_links.spotify} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              Spotify
                            </a>
                          )}
                          {memberData.social_links.youtube && (
                            <a href={memberData.social_links.youtube} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              YouTube
                            </a>
                          )}
                          {memberData.social_links.facebook && (
                            <a href={memberData.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              Facebook
                            </a>
                          )}
                          {memberData.social_links.twitter && (
                            <a href={memberData.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              Twitter
                            </a>
                          )}
                          {memberData.social_links.website && (
                            <a href={memberData.social_links.website} target="_blank" rel="noopener noreferrer" className="text-blue-light hover:underline">
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-white/50" />
                      <div className="flex-1">
                        <p className="text-white/70 text-sm">{t('portal.overview.memberSince')}</p>
                        <p className="text-white">{new Date(memberData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-white">First Name *</Label>
                        <Input
                          id="first_name"
                          value={editFormData.first_name}
                          onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="second_name" className="text-white">Last Name *</Label>
                        <Input
                          id="second_name"
                          value={editFormData.second_name}
                          onChange={(e) => setEditFormData({...editFormData, second_name: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artist_name" className="text-white">Artist Name</Label>
                      <Input
                        id="artist_name"
                        value={editFormData.artist_name}
                        onChange={(e) => setEditFormData({...editFormData, artist_name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="e.g., DJ Shadow"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder="+34 123 456 789"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-white">Street Address</Label>
                      <Input
                        id="address"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-white">City</Label>
                        <Input
                          id="city"
                          value={editFormData.city}
                          onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code" className="text-white">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={editFormData.postal_code}
                          onChange={(e) => setEditFormData({...editFormData, postal_code: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-white">Country</Label>
                        <Input
                          id="country"
                          value={editFormData.country}
                          onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4">
                      <p className="text-white/70 text-sm mb-3">
                        {FEATURE_TAX_DEDUCTION_UI
                          ? "Company (optional – for tax receipt on behalf of company)"
                          : "Company (optional)"}
                      </p>
                      <p className="text-white/50 text-xs mb-3">
                        {FEATURE_TAX_DEDUCTION_UI
                          ? "If your employer pays your membership, add company details here. When paying, you can choose to issue the tax receipt to the company instead of yourself."
                          : "If you want company details on file for correspondence or invoicing, add them here."}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name" className="text-white">Company name</Label>
                          <Input
                            id="company_name"
                            value={editFormData.company_name}
                            onChange={(e) => setEditFormData({...editFormData, company_name: e.target.value})}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="Acme S.L."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_cif" className="text-white">CIF / NIF</Label>
                          <Input
                            id="company_cif"
                            value={editFormData.company_cif}
                            onChange={(e) => setEditFormData({...editFormData, company_cif: e.target.value})}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="B12345678"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="company_address" className="text-white">Company address</Label>
                        <Input
                          id="company_address"
                          value={editFormData.company_address}
                          onChange={(e) => setEditFormData({...editFormData, company_address: e.target.value})}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Carrer Example 123, Barcelona"
                        />
                      </div>
                    </div>

                    {/* Newsletter preference */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.newsletter_subscribe ?? true}
                          onChange={(e) => setEditFormData({...editFormData, newsletter_subscribe: e.target.checked})}
                          className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                        />
                        <span className="text-white text-sm">{t('portal.profile.newsletterOptIn')}</span>
                      </label>
                    </div>

                    {/* Profile Picture Upload */}
                    <div className="space-y-2">
                      <Label className="text-white">Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        {memberData.profile_picture ? (
                          <img 
                            src={memberData.profile_picture} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
                            <User className="h-10 w-10 text-white/30" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleProfilePictureUpload(file);
                              }
                            }}
                            className="bg-white/10 border-white/20 text-white"
                            disabled={uploadingPicture}
                          />
                          <p className="text-white/50 text-xs mt-1">JPEG, PNG, or WebP (max 5MB)</p>
                        </div>
                        {uploadingPicture && (
                          <Loader2 className="h-5 w-5 text-blue-light animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-white">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editFormData.bio}
                        onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3">
                      <Label className="text-white">Social Links</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="social_instagram" className="text-white text-sm">Instagram</Label>
                          <Input
                            id="social_instagram"
                            type="url"
                            value={editFormData.social_links.instagram}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, instagram: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://instagram.com/yourusername"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_soundcloud" className="text-white text-sm">SoundCloud</Label>
                          <Input
                            id="social_soundcloud"
                            type="url"
                            value={editFormData.social_links.soundcloud}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, soundcloud: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://soundcloud.com/yourusername"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_spotify" className="text-white text-sm">Spotify</Label>
                          <Input
                            id="social_spotify"
                            type="url"
                            value={editFormData.social_links.spotify}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, spotify: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://open.spotify.com/artist/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_youtube" className="text-white text-sm">YouTube</Label>
                          <Input
                            id="social_youtube"
                            type="url"
                            value={editFormData.social_links.youtube}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, youtube: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://youtube.com/@yourusername"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_facebook" className="text-white text-sm">Facebook</Label>
                          <Input
                            id="social_facebook"
                            type="url"
                            value={editFormData.social_links.facebook}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, facebook: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://facebook.com/yourusername"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="social_twitter" className="text-white text-sm">Twitter/X</Label>
                          <Input
                            id="social_twitter"
                            type="url"
                            value={editFormData.social_links.twitter}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, twitter: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://twitter.com/yourusername"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="social_website" className="text-white text-sm">Website</Label>
                          <Input
                            id="social_website"
                            type="url"
                            value={editFormData.social_links.website}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              social_links: {...editFormData.social_links, website: e.target.value}
                            })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={saveProfile}
                        disabled={isSaving}
                        className="flex-1 bg-blue-medium hover:bg-blue-dark text-white"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {t('portal.profile.saveChanges')}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <CloseIcon className="h-4 w-4 mr-2" />
                        {t('portal.profile.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password Section */}
            <Card className="bg-black/40 border-white/10 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-yellow-500" />
                  {t('portal.changePassword.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="space-y-4">
                    <p className="text-white/70 text-sm">{t('portal.changePassword.description')}</p>
                    <Button
                      onClick={() => setIsChangingPassword(true)}
                      variant="outline"
                      className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {t('portal.changePassword.button')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password" className="text-white">
                        {t('portal.changePassword.currentPassword')} *
                      </Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder={t('portal.changePassword.currentPasswordPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-white">
                        {t('portal.changePassword.newPassword')} *
                      </Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder={t('portal.changePassword.newPasswordPlaceholder')}
                      />
                      <p className="text-white/50 text-xs">{t('portal.changePassword.passwordRequirement')}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-white">
                        {t('portal.changePassword.confirmPassword')} *
                      </Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder={t('portal.changePassword.confirmPasswordPlaceholder')}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {t('portal.changePassword.saveButton')}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                        }}
                        variant="outline"
                        disabled={isSaving}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <CloseIcon className="h-4 w-4 mr-2" />
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="mt-6 space-y-6">
            {/* Payment Allocation - Show if there's unallocated balance */}
            <PaymentAllocation />
            
            {/* Payment Checkout / Renewal */}
            {memberData && (
              <>
                {(memberData.payment_status === 'unpaid' || 
                  memberData.payment_status === 'overdue' ||
                  (memberData.membership_end_date && new Date(memberData.membership_end_date) < new Date())) && (
                  <PaymentCheckout
                    memberId={memberData.id}
                    currentMembershipType={memberData.membership_type}
                    currentPaymentStatus={memberData.payment_status}
                    companyDetails={
                      memberData.company_name && memberData.company_cif
                        ? {
                            company_name: memberData.company_name,
                            company_cif: memberData.company_cif,
                            company_address: memberData.company_address || undefined,
                          }
                        : null
                    }
                    onPaymentSuccess={() => {
                      fetchMemberData();
                      toast({
                        title: "Redirecting to Payment",
                        description: "You will be redirected to Stripe to complete your payment",
                      });
                    }}
                  />
                )}
                
                {memberData.payment_status === 'paid' && 
                 memberData.membership_end_date && 
                 new Date(memberData.membership_end_date) > new Date() && (
                  <MembershipRenewal
                    currentMembershipType={memberData.membership_type}
                    membershipEndDate={memberData.membership_end_date}
                    onRenewalComplete={() => {
                      fetchMemberData();
                    }}
                  />
                )}
              </>
            )}
            
            <PaymentHistory />
          </TabsContent>

          {/* Sponsorship Tab */}
          <TabsContent value="sponsorship" className="mt-6 space-y-6">
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-light" />
                  {t('portal.sponsorship.title')}
                </CardTitle>
                <p className="text-white/70 text-sm mt-2">
                  {t('portal.sponsorship.description')}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invitation Form */}
                <div className="space-y-4 pb-6 border-b border-white/10">
                  <h3 className="text-white font-semibold">{t('portal.sponsorship.inviteForm.title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invitee_first_name" className="text-white">
                        {t('portal.sponsorship.inviteForm.firstName')} *
                      </Label>
                      <Input
                        id="invitee_first_name"
                        value={inviteFormData.first_name}
                        onChange={(e) => setInviteFormData({...inviteFormData, first_name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={t('portal.sponsorship.inviteForm.firstNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invitee_email" className="text-white">
                        {t('portal.sponsorship.inviteForm.email')} *
                      </Label>
                      <Input
                        id="invitee_email"
                        type="email"
                        value={inviteFormData.email}
                        onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        placeholder={t('portal.sponsorship.inviteForm.emailPlaceholder')}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSendInvitation}
                    disabled={isSendingInvitation || !inviteFormData.first_name || !inviteFormData.email}
                    className="bg-blue-medium hover:bg-blue-dark text-white"
                  >
                    {isSendingInvitation ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('portal.sponsorship.inviteForm.sending')}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('portal.sponsorship.inviteForm.button')}
                      </>
                    )}
                  </Button>
                </div>

                {/* Invitations List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">{t('portal.sponsorship.invitations.title')}</h3>
                    <Button
                      onClick={fetchInvitations}
                      disabled={invitationsLoading}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {invitationsLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {t('common.refresh')}
                    </Button>
                  </div>
                  {invitationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 text-blue-light animate-spin" />
                    </div>
                  ) : invitations.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="h-12 w-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/70 font-semibold mb-2">{t('portal.sponsorship.invitations.empty')}</p>
                      <p className="text-white/50 text-sm">{t('portal.sponsorship.invitations.emptyDescription')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitations.map((invitation) => (
                        <Card key={invitation.id} className="bg-black/20 border-white/10">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitations.name')}</p>
                                <p className="text-white font-medium">{invitation.invitee_first_name}</p>
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitations.email')}</p>
                                <p className="text-white">{invitation.invitee_email}</p>
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitations.status')}</p>
                                {getInvitationStatusBadge(invitation.status)}
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitations.sentAt')}</p>
                                <p className="text-white text-sm">
                                  {new Date(invitation.sent_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invited Members List */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">{t('portal.sponsorship.invitedMembers.title')}</h3>
                    <Button
                      onClick={fetchInvitedMembers}
                      disabled={invitedMembersLoading}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      {invitedMembersLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {t('common.refresh')}
                    </Button>
                  </div>
                  {invitedMembersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 text-blue-light animate-spin" />
                    </div>
                  ) : invitedMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/70 font-semibold mb-2">{t('portal.sponsorship.invitedMembers.empty')}</p>
                      <p className="text-white/50 text-sm">{t('portal.sponsorship.invitedMembers.emptyDescription')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitedMembers.map((member) => (
                        <Card key={member.id} className="bg-black/20 border-white/10">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitedMembers.name')}</p>
                                <p className="text-white font-medium">{member.first_name} {member.second_name}</p>
                                {member.artist_name && (
                                  <p className="text-blue-light text-xs">{member.artist_name}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitedMembers.email')}</p>
                                <p className="text-white text-sm">{member.email}</p>
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitedMembers.status')}</p>
                                {getStatusBadge(member.status)}
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitedMembers.membership')}</p>
                                {getMembershipTypeBadge(member.membership_type || 'in_progress')}
                              </div>
                              <div>
                                <p className="text-white/70 text-sm mb-1">{t('portal.sponsorship.invitedMembers.joined')}</p>
                                <p className="text-white text-sm">
                                  {new Date(member.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberPortal;

