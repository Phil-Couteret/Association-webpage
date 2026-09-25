import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Calendar, Users, Home, Image, UserCog, UserPlus, Mail, Send, UserCheck, CreditCard, Mic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextNew";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import EventsManager from "@/components/admin/EventsManager";
import ArtistsManager from "@/components/admin/ArtistsManager";
import GalleryManager from "@/components/admin/GalleryManager";
import UsersManager from "@/components/admin/UsersManager";
import MembersManager from "@/components/admin/MembersManager";
import NewsletterManager from "@/components/admin/NewsletterManager";
import EmailAutomationManager from "@/components/admin/EmailAutomationManager";
import InvitationsManager from "@/components/admin/InvitationsManager";
import PaymentConfigManager from "@/components/admin/PaymentConfigManager";
import OpenCallManager from "@/components/admin/OpenCallManager";
import LanguageSelector from "@/components/LanguageSelector";
import { SEO } from "@/components/SEO";

const Admin = () => {
  const { logout, user, isSuperAdmin, canAccessSection } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("events");

  const visibleTabs = [
    canAccessSection('events') && 'events',
    canAccessSection('artists') && 'artists',
    canAccessSection('open_call') && 'open-call',
    canAccessSection('gallery') && 'gallery',
    canAccessSection('members') && 'members',
    canAccessSection('newsletter') && 'newsletter',
    canAccessSection('email_automation') && 'email-automation',
    canAccessSection('invitations') && 'invitations',
    canAccessSection('payment') && 'payment-config',
    isSuperAdmin && 'users',
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (!visibleTabs.includes(activeTab) && visibleTabs[0]) {
      setActiveTab(visibleTabs[0]);
    }
  }, [activeTab, visibleTabs]);

  const handleLogout = () => {
    logout();
  };

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-deep-purple">
      <SEO 
        title="Admin Dashboard | Elektr-Âme"
        description="Elektr-Âme admin dashboard for managing events, artists, members, and content."
        url="https://www.elektr-ame.com/admin"
        keywords="admin, dashboard, Elektr-Âme"
        robots="noindex, nofollow"
      />
      {/* Admin Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">{t('admin.header.title')}</h1>
              {user && (
                <span className="text-electric-blue text-sm">
                  {t('admin.header.welcome')}, {user.name} {isSuperAdmin && `(${t('admin.header.superadmin')})`}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Link to="/" onClick={handleHomeClick}>
                <Button variant="outline" className="border-electric-blue text-electric-blue hover:bg-electric-blue/20">
                  <Home className="h-4 w-4 mr-2" />
                  {t('admin.header.home')}
                </Button>
              </Link>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="border-red-400 text-red-400 hover:bg-red-400/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('admin.header.logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 bg-black/40 border-white/10 p-2">
            {canAccessSection('events') && (
              <TabsTrigger value="events" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <Calendar className="h-4 w-4 mr-2" />
                {t('admin.tabs.events')}
              </TabsTrigger>
            )}
            {canAccessSection('artists') && (
              <TabsTrigger value="artists" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <Users className="h-4 w-4 mr-2" />
                {t('admin.tabs.artists')}
              </TabsTrigger>
            )}
            {canAccessSection('open_call') && (
              <TabsTrigger value="open-call" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <Mic className="h-4 w-4 mr-2" />
                {t('admin.tabs.openCall')}
              </TabsTrigger>
            )}
            {canAccessSection('gallery') && (
              <TabsTrigger value="gallery" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <Image className="h-4 w-4 mr-2" />
                {t('admin.tabs.gallery')}
              </TabsTrigger>
            )}
            {canAccessSection('members') && (
              <TabsTrigger value="members" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('admin.tabs.members')}
              </TabsTrigger>
            )}
            {canAccessSection('newsletter') && (
              <TabsTrigger value="newsletter" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <Mail className="h-4 w-4 mr-2" />
                {t('admin.tabs.newsletter')}
              </TabsTrigger>
            )}
            {canAccessSection('email_automation') && (
              <TabsTrigger value="email-automation" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <Send className="h-4 w-4 mr-2" />
                {t('admin.tabs.emailAutomation')}
              </TabsTrigger>
            )}
            {canAccessSection('invitations') && (
              <TabsTrigger value="invitations" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <UserCheck className="h-4 w-4 mr-2" />
                {t('admin.tabs.invitations')}
              </TabsTrigger>
            )}
            {canAccessSection('payment') && (
              <TabsTrigger value="payment-config" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="users" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple text-white">
                <UserCog className="h-4 w-4 mr-2" />
                {t('admin.tabs.users')}
              </TabsTrigger>
            )}
          </TabsList>
          
          {canAccessSection('events') && (
            <TabsContent value="events" className="mt-6">
              <EventsManager />
            </TabsContent>
          )}
          {canAccessSection('artists') && (
            <TabsContent value="artists" className="mt-6">
              <ArtistsManager />
            </TabsContent>
          )}
          {canAccessSection('open_call') && (
            <TabsContent value="open-call" className="mt-6">
              <OpenCallManager />
            </TabsContent>
          )}
          {canAccessSection('gallery') && (
            <TabsContent value="gallery" className="mt-6">
              <GalleryManager />
            </TabsContent>
          )}
          {canAccessSection('members') && (
            <TabsContent value="members" className="mt-6">
              <MembersManager />
            </TabsContent>
          )}
          {canAccessSection('newsletter') && (
            <TabsContent value="newsletter" className="mt-6">
              <NewsletterManager />
            </TabsContent>
          )}
          {canAccessSection('email_automation') && (
            <TabsContent value="email-automation" className="mt-6">
              <EmailAutomationManager />
            </TabsContent>
          )}
          {canAccessSection('invitations') && (
            <TabsContent value="invitations" className="mt-6">
              <InvitationsManager />
            </TabsContent>
          )}
          {canAccessSection('payment') && (
            <TabsContent value="payment-config" className="mt-6">
              <PaymentConfigManager />
            </TabsContent>
          )}
          {isSuperAdmin && (
            <TabsContent value="users" className="mt-6">
              <UsersManager />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

