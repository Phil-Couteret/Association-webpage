import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Mail, Loader2, CheckCircle, XCircle, Users, Send, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
  ip_address: string | null;
  unsubscribed_at: string | null;
}

interface Stats {
  total: number;
  active: number;
  unsubscribed: number;
}

interface Campaign {
  id: number;
  subject: string;
  content: string;
  sent_at: string;
  recipients_count: number;
  opened_count: number;
}

const NewsletterManager = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unsubscribed: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [activeView, setActiveView] = useState<'subscribers' | 'compose' | 'history'>('subscribers');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchSubscribers();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    filterSubscribers();
  }, [subscribers, statusFilter]);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter-list.php', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setStats(data.stats || { total: 0, active: 0, unsubscribed: 0 });
      } else {
        throw new Error(data.error || 'Failed to fetch subscribers');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.newsletter.fetchError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/newsletter-campaigns-list.php', {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const handleSendNewsletter = async () => {
    if (!subject || !content) {
      toast({
        title: t('admin.message.error'),
        description: t('admin.newsletter.compose.validation'),
        variant: "destructive",
      });
      return;
    }

    if (stats.active === 0) {
      toast({
        title: t('admin.message.error'),
        description: t('admin.newsletter.compose.noSubscribers'),
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/newsletter-send.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject, content })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: t('admin.newsletter.compose.sent', { count: data.sent }),
        });
        setSubject('');
        setContent('');
        setActiveView('history');
        fetchCampaigns();
      } else {
        throw new Error(data.error || 'Failed to send newsletter');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.newsletter.compose.sendError'),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const filterSubscribers = () => {
    let filtered = [...subscribers];
    
    if (statusFilter === 'active') {
      filtered = filtered.filter(s => !s.unsubscribed_at);
    } else if (statusFilter === 'unsubscribed') {
      filtered = filtered.filter(s => s.unsubscribed_at);
    }
    
    setFilteredSubscribers(filtered);
  };

  const handleExport = async (exportType: 'active' | 'all' | 'unsubscribed') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/newsletter-export.php?type=${exportType}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter_subscribers_${exportType}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: t('admin.message.success'),
          description: t('admin.newsletter.exported'),
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.newsletter.exportError'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setActiveView('subscribers')}
          className={activeView === 'subscribers' 
            ? 'bg-electric-blue text-deep-purple hover:bg-electric-blue/80' 
            : 'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white'
          }
        >
          <Users className="h-4 w-4 mr-2" />
          {t('admin.newsletter.view.subscribers')}
        </Button>
        <Button
          onClick={() => setActiveView('compose')}
          className={activeView === 'compose' 
            ? 'bg-electric-blue text-deep-purple hover:bg-electric-blue/80' 
            : 'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white'
          }
        >
          <Send className="h-4 w-4 mr-2" />
          {t('admin.newsletter.view.compose')}
        </Button>
        <Button
          onClick={() => setActiveView('history')}
          className={activeView === 'history' 
            ? 'bg-electric-blue text-deep-purple hover:bg-electric-blue/80' 
            : 'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white'
          }
        >
          <History className="h-4 w-4 mr-2" />
          {t('admin.newsletter.view.history')}
        </Button>
      </div>

      {/* Subscribers View */}
      {activeView === 'subscribers' && (
        <Card className="bg-black/50 backdrop-blur-md border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <Mail className="h-6 w-6 text-electric-blue" />
                  {t('admin.newsletter.title')}
                </CardTitle>
                <CardDescription className="text-white/60 mt-2">
                  {t('admin.newsletter.subtitle')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-black/40 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-purple border-white/10">
                  <SelectItem value="active" className="text-white">{t('admin.newsletter.filter.active')}</SelectItem>
                  <SelectItem value="all" className="text-white">{t('admin.newsletter.filter.all')}</SelectItem>
                  <SelectItem value="unsubscribed" className="text-white">{t('admin.newsletter.filter.unsubscribed')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleExport(statusFilter as 'active' | 'all' | 'unsubscribed')}
                disabled={isExporting || filteredSubscribers.length === 0}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? t('admin.newsletter.exporting') : t('admin.newsletter.exportCSV')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-black/40 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{t('admin.newsletter.stats.total')}</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-electric-blue" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{t('admin.newsletter.stats.active')}</p>
                    <p className="text-3xl font-bold text-green-400">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{t('admin.newsletter.stats.unsubscribed')}</p>
                    <p className="text-3xl font-bold text-red-400">{stats.unsubscribed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscribers Table */}
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">{t('admin.newsletter.noSubscribers')}</p>
            </div>
          ) : (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white">{t('admin.newsletter.table.email')}</TableHead>
                    <TableHead className="text-white">{t('admin.newsletter.table.subscribed')}</TableHead>
                    <TableHead className="text-white">{t('admin.newsletter.table.status')}</TableHead>
                    <TableHead className="text-white">{t('admin.newsletter.table.ip')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{subscriber.email}</TableCell>
                      <TableCell className="text-white/80 text-sm">
                        {formatDate(subscriber.subscribed_at)}
                      </TableCell>
                      <TableCell>
                        {subscriber.unsubscribed_at ? (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-400/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            {t('admin.newsletter.status.unsubscribed')}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-400/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t('admin.newsletter.status.active')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-white/60 text-sm">
                        {subscriber.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-white/40 text-sm mt-4">
            {t('admin.newsletter.showing')} {filteredSubscribers.length} {t('admin.newsletter.of')} {stats.total} {t('admin.newsletter.subscribers')}
          </p>
        </CardContent>
      </Card>
      )}

      {/* Compose Newsletter View */}
      {activeView === 'compose' && (
        <Card className="bg-black/50 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Send className="h-6 w-6 text-electric-blue" />
              {t('admin.newsletter.compose.title')}
            </CardTitle>
            <CardDescription className="text-white/60 mt-2">
              {t('admin.newsletter.compose.subtitle', { count: stats.active })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white">{t('admin.newsletter.compose.subject')}</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('admin.newsletter.compose.subjectPlaceholder')}
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">{t('admin.newsletter.compose.content')}</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('admin.newsletter.compose.contentPlaceholder')}
                className="bg-black/40 border-white/10 text-white min-h-[300px]"
              />
              <p className="text-white/40 text-sm">
                {t('admin.newsletter.compose.note')}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="text-white/60 text-sm">
                {t('admin.newsletter.compose.willSend', { count: stats.active })}
              </div>
              <Button
                onClick={handleSendNewsletter}
                disabled={isSending || !subject || !content || stats.active === 0}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('admin.newsletter.compose.sending')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('admin.newsletter.compose.send')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign History View */}
      {activeView === 'history' && (
        <Card className="bg-black/50 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <History className="h-6 w-6 text-electric-blue" />
              {t('admin.newsletter.history.title')}
            </CardTitle>
            <CardDescription className="text-white/60 mt-2">
              {t('admin.newsletter.history.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">{t('admin.newsletter.history.noCampaigns')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="bg-black/40 border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{campaign.subject}</h3>
                          <p className="text-white/60 text-sm mb-2">
                            {formatDate(campaign.sent_at)}
                          </p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-white/80">
                              <Mail className="h-4 w-4 inline mr-1" />
                              {campaign.recipients_count} {t('admin.newsletter.history.sent')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded border border-white/5">
                        <p className="text-white/70 text-sm whitespace-pre-wrap">
                          {campaign.content.substring(0, 200)}
                          {campaign.content.length > 200 && '...'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewsletterManager;

