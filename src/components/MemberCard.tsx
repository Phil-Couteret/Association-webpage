import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MemberCardProps {
  memberId: number;
  firstName: string;
  secondName: string;
  artistName?: string;
  membershipType: string;
  status: string;
  memberSince: string;
  expiryDate?: string;
}

const MemberCard = ({
  memberId,
  firstName,
  secondName,
  artistName,
  membershipType,
  status,
  memberSince,
  expiryDate,
}: MemberCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const memberIdFormatted = `EA-${String(memberId).padStart(6, '0')}`;
  // Use external API directly - no session/cookies, works on all mobile browsers
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(memberIdFormatted)}`;

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'in_progress': return 'from-gray-600 to-gray-800';
      case 'yearly': return 'from-purple-600 to-purple-800';
      case 'lifetime': return 'from-yellow-600 to-yellow-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getMembershipLabel = (type: string) => {
    switch (type) {
      case 'in_progress': return 'In Progress';
      case 'yearly': return 'Yearly Member';
      case 'lifetime': return 'Lifetime Member';
      default: return 'Member';
    }
  };

  const downloadCard = async () => {
    try {
      // Using html2canvas to convert the card to an image
      const html2canvas = (await import('html2canvas')).default;
      
      if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
        });
        
        const link = document.createElement('a');
        link.download = `elektr-ame-membership-${memberIdFormatted}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast({
          title: "Card Downloaded",
          description: "Your membership card has been downloaded successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareCard = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Elektr-Âme Membership',
          text: `I'm a member of Elektr-Âme! Member ID: ${memberIdFormatted}`,
          url: 'https://www.elektr-ame.com',
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      toast({
        title: "Share Not Supported",
        description: "Sharing is not supported on this device.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Digital Card */}
      <div ref={cardRef} className="relative">
        <Card className={`bg-gradient-to-br ${getMembershipColor(membershipType)} border-none overflow-hidden`}>
          <CardContent className="p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
            </div>

            {/* Card Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    <span className="text-white/90">ELEKTR</span>-ÂME
                  </h2>
                  <p className="text-white/70 text-sm">{getMembershipLabel(membershipType)}</p>
                </div>
                {status === 'approved' && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-white text-xs font-semibold">ACTIVE</p>
                  </div>
                )}
              </div>

              {/* Member Info */}
              <div className="mb-8">
                <p className="text-white/70 text-sm mb-1">Member Name</p>
                <p className="text-white text-xl font-semibold">{firstName} {secondName}</p>
                {artistName && (
                  <p className="text-white/90 text-sm mt-1">aka {artistName}</p>
                )}
              </div>

              {/* Footer Info */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/70 text-xs mb-1">Member ID</p>
                  <p className="text-white font-mono text-sm">{memberIdFormatted}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs mb-1">Member Since</p>
                  <p className="text-white text-sm">{new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {expiryDate && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex justify-between items-center">
                    <p className="text-white/70 text-xs">Valid Until</p>
                    <p className="text-white text-sm font-semibold">{new Date(expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Card */}
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <p className="text-white/70 text-sm mb-4 text-center">
              Show this QR code at partner venues for member benefits
            </p>
            <div className="bg-white p-4 rounded-lg mb-6 flex justify-center items-center">
              <div className="shrink-0 w-[224px] h-[224px] sm:w-[256px] sm:h-[256px] flex items-center justify-center">
                <img
                  src={qrUrl}
                  alt={`QR code for ${memberIdFormatted}`}
                  width={256}
                  height={256}
                  loading="eager"
                  className="max-w-full max-h-full object-contain"
                  style={{ minWidth: 200, minHeight: 200 }}
                />
              </div>
            </div>
            <p className="text-white/50 text-xs font-mono mb-6">{memberIdFormatted}</p>
            
            <div className="flex gap-3 w-full max-w-sm">
              <Button 
                onClick={downloadCard}
                className="flex-1 bg-blue-medium hover:bg-blue-dark text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Card
              </Button>
              <Button 
                onClick={shareCard}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          className="w-full bg-black hover:bg-black/80 text-white h-14 text-base"
          disabled
        >
          <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Add to Apple Wallet
        </Button>
        <Button 
          className="w-full bg-blue-medium hover:bg-blue-dark text-white h-14 text-base"
          disabled
        >
          <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Add to Google Wallet
        </Button>
      </div>

      <p className="text-white/50 text-xs text-center">
        * Apple Wallet and Google Wallet integration coming soon
      </p>
    </div>
  );
};

export default MemberCard;

