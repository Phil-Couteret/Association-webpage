import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, User, LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMemberSession } from "@/contexts/MemberSessionContext";
import MemberDirectory from "@/components/portal/MemberDirectory";
import MemberPortal from "@/pages/MemberPortal";
import Messaging from "@/components/portal/Messaging";

const MemberAreaLayout = () => {
  const [activeTab, setActiveTab] = useState("portal");
  const [messageRecipientId, setMessageRecipientId] = useState<number | null>(null);
  const [messageRecipientName, setMessageRecipientName] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh: refreshMemberSession } = useMemberSession();

  useEffect(() => {
    refreshMemberSession();
  }, [refreshMemberSession]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/member-logout.php', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        await refreshMemberSession();
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out.',
        });
        navigate('/');
      } else {
        throw new Error(data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to log out',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-deep-purple via-black to-deep-purple">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Member Area
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/20"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border-white/10 mb-6">
            <TabsTrigger value="portal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messaging
            </TabsTrigger>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Directory
            </TabsTrigger>
          </TabsList>

          {/* Member Portal Tab (Profile) */}
          <TabsContent value="portal" className="mt-0">
            <div className="-mx-4 -my-8">
              <MemberPortal />
            </div>
          </TabsContent>

          {/* Messaging Tab */}
          <TabsContent value="messaging" className="mt-0">
            <Messaging 
              prefillRecipientId={messageRecipientId || undefined}
              prefillRecipientName={messageRecipientName || undefined}
            />
          </TabsContent>

          {/* Directory Tab */}
          <TabsContent value="directory" className="mt-0">
            <MemberDirectory 
              onSendMessage={(memberId, memberName) => {
                setMessageRecipientId(memberId);
                setMessageRecipientName(memberName);
                setActiveTab("messaging");
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberAreaLayout;

