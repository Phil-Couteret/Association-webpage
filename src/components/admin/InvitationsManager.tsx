import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle, XCircle, Clock, Trash2, UserPlus, AlertTriangle, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

interface Invitation {
  id: number;
  inviter_id: number;
  invitee_first_name: string;
  invitee_email: string;
  status: 'sent' | 'registered' | 'payed' | 'approved';
  email_sent: boolean;
  email_sent_at: string | null;
  email_error: string | null;
  invitee_member_id: number | null;
  sent_at: string;
  registered_at: string | null;
  payed_at: string | null;
  approved_at: string | null;
  created_at: string;
  inviter_first_name: string;
  inviter_second_name: string;
  inviter_email: string;
}

interface Statistics {
  total: number;
  sent_count: number;
  registered_count: number;
  payed_count: number;
  approved_count: number;
  email_sent_count: number;
  email_not_sent_count: number;
  old_count: number;
}

const InvitationsManager = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emailSentFilter, setEmailSentFilter] = useState<string>('all');
  const [daysOldFilter, setDaysOldFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fixingInvitation, setFixingInvitation] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchInvitations();
  }, [statusFilter, emailSentFilter, daysOldFilter]);

  useEffect(() => {
    // Apply search filter
    let filtered = invitations;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invitee_first_name.toLowerCase().includes(term) ||
        inv.invitee_email.toLowerCase().includes(term) ||
        inv.inviter_first_name.toLowerCase().includes(term) ||
        inv.inviter_email.toLowerCase().includes(term)
      );
    }

    setFilteredInvitations(filtered);
  }, [invitations, searchTerm]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (emailSentFilter !== 'all') params.append('email_sent', emailSentFilter === 'sent' ? 'true' : 'false');
      if (daysOldFilter !== 'all') params.append('days_old', daysOldFilter);

      const response = await fetch(`/api/invitations-admin-list.php?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned ${response.status}: Expected JSON but got ${contentType}`);
      }

      const data = await response.json();

      if (data.success) {
        setInvitations(data.invitations || []);
        setStatistics(data.statistics || null);
      } else {
        throw new Error(data.error || 'Failed to fetch invitations');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.message.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invitationToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/invitations-admin-delete.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          invitation_id: invitationToDelete.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: t('admin.invitations.deleteSuccess'),
        });
        setInvitationToDelete(null);
        fetchInvitations();
      } else {
        throw new Error(data.error || 'Failed to delete invitation');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.message.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFixLink = async (invitation: Invitation) => {
    if (!invitation.invitee_email) return;

    setFixingInvitation(invitation.id);
    try {
      const response = await fetch('/api/invitations-fix-now.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: invitation.invitee_email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: data.message || 'Invitation link fixed successfully',
        });
        fetchInvitations();
      } else {
        throw new Error(data.error || 'Failed to fix invitation link');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : 'Failed to fix invitation link',
        variant: 'destructive',
      });
    } finally {
      setFixingInvitation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">{t('admin.invitations.status.sent')}</Badge>;
      case 'registered':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">{t('admin.invitations.status.registered')}</Badge>;
      case 'payed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">{t('admin.invitations.status.payed')}</Badge>;
      case 'approved':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">{t('admin.invitations.status.approved')}</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">{status}</Badge>;
    }
  };

  const getDaysOld = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-electric-blue" />
            {t('admin.invitations.title')}
          </CardTitle>
          <CardDescription className="text-white/70">
            {t('admin.invitations.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-black/40 p-4 rounded-lg">
                <p className="text-white/70 text-sm">{t('admin.invitations.stats.total')}</p>
                <p className="text-white text-2xl font-bold">{statistics.total}</p>
              </div>
              <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                <p className="text-blue-400 text-sm">{t('admin.invitations.stats.sent')}</p>
                <p className="text-white text-2xl font-bold">{statistics.sent_count}</p>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <p className="text-green-400 text-sm">{t('admin.invitations.stats.emailSent')}</p>
                <p className="text-white text-2xl font-bold">{statistics.email_sent_count}</p>
              </div>
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <p className="text-red-400 text-sm">{t('admin.invitations.stats.emailNotSent')}</p>
                <p className="text-white text-2xl font-bold">{statistics.email_not_sent_count}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('admin.invitations.filters.status')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.invitations.filters.all')}</SelectItem>
                  <SelectItem value="sent">{t('admin.invitations.status.sent')}</SelectItem>
                  <SelectItem value="registered">{t('admin.invitations.status.registered')}</SelectItem>
                  <SelectItem value="payed">{t('admin.invitations.status.payed')}</SelectItem>
                  <SelectItem value="approved">{t('admin.invitations.status.approved')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('admin.invitations.filters.emailStatus')}</label>
              <Select value={emailSentFilter} onValueChange={setEmailSentFilter}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.invitations.filters.all')}</SelectItem>
                  <SelectItem value="sent">{t('admin.invitations.filters.emailSent')}</SelectItem>
                  <SelectItem value="not_sent">{t('admin.invitations.filters.emailNotSent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('admin.invitations.filters.age')}</label>
              <Select value={daysOldFilter} onValueChange={setDaysOldFilter}>
                <SelectTrigger className="bg-black/40 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.invitations.filters.all')}</SelectItem>
                  <SelectItem value="30">{t('admin.invitations.filters.olderThan30')}</SelectItem>
                  <SelectItem value="60">{t('admin.invitations.filters.olderThan60')}</SelectItem>
                  <SelectItem value="90">{t('admin.invitations.filters.olderThan90')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">{t('admin.invitations.filters.search')}</label>
              <Input
                placeholder={t('admin.invitations.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border-white/20 text-white"
              />
            </div>
          </div>

          {/* Table */}
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">{t('admin.invitations.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/80">{t('admin.invitations.table.inviter')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.invitee')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.email')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.status')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.emailStatus')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.sentAt')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.age')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.invitations.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id} className="border-white/10">
                      <TableCell className="text-white">
                        {invitation.inviter_first_name} {invitation.inviter_second_name}
                        <br />
                        <span className="text-white/50 text-xs">{invitation.inviter_email}</span>
                      </TableCell>
                      <TableCell className="text-white">{invitation.invitee_first_name}</TableCell>
                      <TableCell className="text-white">{invitation.invitee_email}</TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>
                        {invitation.email_sent ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 text-sm">
                              {invitation.email_sent_at ? new Date(invitation.email_sent_at).toLocaleDateString() : t('admin.invitations.emailSent')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-red-400 text-sm">{t('admin.invitations.emailNotSent')}</span>
                            {invitation.email_error && (
                              <span className="text-red-400 text-xs" title={invitation.email_error}>
                                <AlertTriangle className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {new Date(invitation.sent_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white text-sm">
                        {getDaysOld(invitation.sent_at)} {t('admin.invitations.daysAgo')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFixLink(invitation)}
                            disabled={fixingInvitation === invitation.id}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            title="Fix invitation link"
                          >
                            {fixingInvitation === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInvitationToDelete(invitation)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!invitationToDelete} onOpenChange={() => !isDeleting && setInvitationToDelete(null)}>
        <AlertDialogContent className="bg-deep-purple border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('admin.invitations.deleteConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              {invitationToDelete ? t('admin.invitations.deleteConfirm.message', {
                name: invitationToDelete.invitee_first_name || '',
                email: invitationToDelete.invitee_email || '',
              }) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-black/40 border-white/20 text-white hover:bg-black/60">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('admin.invitations.delete')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvitationsManager;

