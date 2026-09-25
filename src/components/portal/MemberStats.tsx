import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  UserPlus, 
  Users, 
  Clock, 
  TrendingUp,
  Loader2,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MemberStatsData {
  success: boolean;
  stats: {
    membership_duration_days: number;
    membership_duration_formatted: string;
    invitations_sent: number;
    invited_members: number;
    events_attended: number;
    last_login: string | null;
    member_since: string;
    membership_start: string | null;
  };
  timeline: Array<{
    date: string;
    type: string;
    title: string;
    description: string;
  }>;
}

const MemberStats = () => {
  const { t } = useLanguage();
  const [statsData, setStatsData] = useState<MemberStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/member-stats.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStatsData(data);
    } catch (err) {
      console.error('Stats error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-electric-blue animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !statsData) {
    return (
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <p className="text-white/70 text-center">{error || 'Failed to load statistics'}</p>
        </CardContent>
      </Card>
    );
  }

  const { stats, timeline } = statsData;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Membership Duration</p>
                <p className="text-2xl font-bold text-white">{stats.membership_duration_days}</p>
                <p className="text-white/50 text-xs mt-1">days</p>
              </div>
              <Clock className="h-8 w-8 text-electric-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Invitations Sent</p>
                <p className="text-2xl font-bold text-white">{stats.invitations_sent}</p>
                <p className="text-white/50 text-xs mt-1">total</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Members Joined</p>
                <p className="text-2xl font-bold text-white">{stats.invited_members}</p>
                <p className="text-white/50 text-xs mt-1">via your invites</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Events Attended</p>
                <p className="text-2xl font-bold text-white">{stats.events_attended}</p>
                <p className="text-white/50 text-xs mt-1">events</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length > 0 ? (
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-electric-blue/20 flex items-center justify-center">
                    {item.type === 'membership_start' ? (
                      <CheckCircle className="h-5 w-5 text-electric-blue" />
                    ) : (
                      <Calendar className="h-5 w-5 text-electric-blue" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-semibold">{item.title}</h4>
                      <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
                        {formatDate(item.date)}
                      </Badge>
                    </div>
                    <p className="text-white/60 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/70 text-center py-8">No activity timeline available</p>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-4">
            <p className="text-white/70 text-sm mb-2">Member Since</p>
            <p className="text-white font-semibold">{formatDate(stats.member_since)}</p>
          </CardContent>
        </Card>
        {stats.last_login && (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="p-4">
              <p className="text-white/70 text-sm mb-2">Last Login</p>
              <p className="text-white font-semibold">{formatDate(stats.last_login)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MemberStats;

