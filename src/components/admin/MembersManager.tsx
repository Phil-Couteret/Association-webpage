import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, Loader2, CheckCircle, XCircle, Clock, CreditCard, Calendar, Edit, AlertTriangle, UserPlus, Trash2, Key, Search, Filter, X, Mail, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import MembershipDialog from "./MembershipDialog";
import AddMemberDialog from "./AddMemberDialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  second_name: string | null;
  artist_name: string | null;
  email: string;
  phone: string;
  street: string | null;
  zip_code: string | null;
  city: string;
  country: string;
  is_dj: boolean;
  is_producer: boolean;
  is_vj: boolean;
  is_visual_artist: boolean;
  is_fan: boolean;
  newsletter_subscribe?: boolean;
  status: 'pending' | 'approved' | 'rejected';
  membership_type?: 'in_progress' | 'yearly' | 'lifetime';
  membership_start_date?: string;
  membership_end_date?: string;
  payment_status?: 'unpaid' | 'paid' | 'overdue';
  last_payment_date?: string;
  payment_amount?: string | number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settingPasswordFor, setSettingPasswordFor] = useState<number | null>(null);
  const [resendingApprovalFor, setResendingApprovalFor] = useState<number | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<{memberId: number, password: string, memberName: string, memberEmail: string} | null>(null);
  
  // Advanced search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    membershipType: 'all',
    paymentStatus: 'all',
    roles: [] as string[],
  });
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // Apply all filters and search
    let filtered = [...members];
    
    // Status filter
    if (statusFilter === 'expiring_soon') {
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);
      filtered = filtered.filter(m => {
        if (!m.membership_end_date) return false;
        const endDate = new Date(m.membership_end_date);
        return endDate > today && endDate <= thirtyDaysLater && m.status === 'approved';
      });
    } else if (statusFilter === 'expired') {
      const today = new Date();
      filtered = filtered.filter(m => {
        if (!m.membership_end_date) return false;
        const endDate = new Date(m.membership_end_date);
        return endDate < today && m.status === 'approved';
      });
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    // Search query (name, email, artist name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.first_name.toLowerCase().includes(query) ||
        m.last_name.toLowerCase().includes(query) ||
        m.second_name?.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.artist_name?.toLowerCase().includes(query)
      );
    }
    
    // City filter
    if (filters.city.trim()) {
      filtered = filtered.filter(m => 
        m.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    
    // Membership type filter
    if (filters.membershipType !== 'all') {
      filtered = filtered.filter(m => m.membership_type === filters.membershipType);
    }
    
    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(m => m.payment_status === filters.paymentStatus);
    }
    
    // Role filters
    if (filters.roles.length > 0) {
      filtered = filtered.filter(m => {
        return filters.roles.some(role => {
          switch(role) {
            case 'dj': return m.is_dj;
            case 'producer': return m.is_producer;
            case 'vj': return m.is_vj;
            case 'visual_artist': return m.is_visual_artist;
            case 'fan': return m.is_fan;
            default: return false;
          }
        });
      });
    }
    
    setFilteredMembers(filtered);
    setSelectedMembers([]); // Clear selections when filters change
  }, [members, statusFilter, searchQuery, filters]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members-list.php', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.members);
      } else {
        throw new Error(data.error || 'Failed to load members');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.message.loadError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/members-export.php', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export members');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elektr-ame-members-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('admin.message.success'),
        description: t('admin.message.exportSuccess'),
      });
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.message.exportError'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleStatusUpdate = async (memberId: number, newStatus: 'approved' | 'rejected') => {
    setUpdatingStatus(memberId);
    try {
      const response = await fetch('/api/members-update-status.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: t('admin.message.statusUpdated').replace('{status}', newStatus),
        });
        fetchMembers();
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.message.updateError'),
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditMembership = (member: Member) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleResendApprovalEmail = async (member: Member) => {
    if (member.status !== 'approved') return;
    setResendingApprovalFor(member.id);
    try {
      const response = await fetch('/api/members-resend-approval-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ member_id: member.id }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: t('admin.members.resendApprovalSuccess'),
        });
      } else {
        throw new Error(data.message || data.error || 'Request failed');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.members.resendApprovalError'),
        variant: 'destructive',
      });
    } finally {
      setResendingApprovalFor(null);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!memberToDelete) {
      // First click - show confirmation
      setMemberToDelete(member);
      return;
    }

    // Second confirmation - actually delete
    setIsDeleting(true);
    try {
      const response = await fetch('/api/members-delete.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          member_id: member.id
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: t('admin.members.deleted'),
        });
        fetchMembers();
        setMemberToDelete(null);
      } else {
        throw new Error(data.error || 'Failed to delete member');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.members.deleteError'),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedMembers.length === 0) return;
    setIsBulkActioning(true);
    try {
      const promises = selectedMembers.map(id => 
        fetch('/api/members-update-status.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: id, status: 'approved' })
        })
      );
      await Promise.all(promises);
      toast({
        title: 'Success',
        description: `${selectedMembers.length} member(s) approved successfully`,
      });
      setSelectedMembers([]);
      fetchMembers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve members',
        variant: 'destructive',
      });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedMembers.length === 0) return;
    setIsBulkActioning(true);
    try {
      const promises = selectedMembers.map(id => 
        fetch('/api/members-update-status.php', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: id, status: 'rejected' })
        })
      );
      await Promise.all(promises);
      toast({
        title: 'Success',
        description: `${selectedMembers.length} member(s) rejected successfully`,
      });
      setSelectedMembers([]);
      fetchMembers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject members',
        variant: 'destructive',
      });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedMembers.length === 0) return;
    setIsBulkActioning(true);
    try {
      const selected = filteredMembers.filter(m => selectedMembers.includes(m.id));
      const csv = [
        ['Name', 'Email', 'City', 'Status', 'Membership Type', 'Payment Status'].join(','),
        ...selected.map(m => [
          `"${m.first_name} ${m.second_name || ''} ${m.last_name}"`.trim(),
          m.email,
          m.city,
          m.status,
          m.membership_type || '',
          m.payment_status || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elektr-ame-members-selected-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Selected members exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export members',
        variant: 'destructive',
      });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleSetPassword = async (member: Member) => {
    setSettingPasswordFor(member.id);
    try {
      const response = await fetch('/api/admin-set-member-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          member_id: member.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedPassword({
          memberId: member.id,
          password: data.new_password,
          memberName: member.first_name + ' ' + member.second_name,
          memberEmail: member.email
        });
      } else {
        throw new Error(data.message || 'Failed to set password');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : 'Failed to set password',
        variant: 'destructive',
      });
    } finally {
      setSettingPasswordFor(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle }
    };
    
    const { variant, icon: Icon } = config[status] || config.pending;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {t(`admin.status.${status}`)}
      </Badge>
    );
  };

  const getMembershipTypeBadge = (type?: string) => {
    if (!type) return <span className="text-white/40">-</span>;
    
    const config: Record<string, { color: string }> = {
      in_progress: { color: 'bg-gray-500' },
      yearly: { color: 'bg-purple-500' },
      lifetime: { color: 'bg-green-500' }
    };
    
    const { color } = config[type] || { color: 'bg-gray-500' };
    const label = type === 'in_progress' ? t('admin.membership.inProgress') :
                  type === 'yearly' ? t('admin.membership.yearly') :
                  type === 'lifetime' ? t('admin.membership.lifetime') : type;
    
    return (
      <Badge className={`${color} text-white border-0`}>
        {label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return <span className="text-white/40">-</span>;
    
    const config: Record<string, { variant: "default" | "secondary" | "destructive", icon: any }> = {
      paid: { variant: "default", icon: CheckCircle },
      unpaid: { variant: "secondary", icon: Clock },
      overdue: { variant: "destructive", icon: AlertTriangle }
    };
    
    const { variant, icon: Icon } = config[status] || config.unpaid;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {t(`admin.payment.${status}`)}
      </Badge>
    );
  };

  const getExpirationWarning = (endDate?: string) => {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {t('admin.expiry.expired')}</span>;
    } else if (daysUntilExpiry <= 7) {
      return <span className="text-orange-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {daysUntilExpiry} {t('admin.expiry.daysLeft')}</span>;
    } else if (daysUntilExpiry <= 30) {
      return <span className="text-yellow-400 text-xs">{t('admin.expiry.expiresIn')} {daysUntilExpiry} {t('admin.expiry.daysLeft')}</span>;
    }
    return null;
  };

  const getStatusCounts = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    return {
      total: members.length,
      pending: members.filter(m => m.status === 'pending').length,
      approved: members.filter(m => m.status === 'approved').length,
      rejected: members.filter(m => m.status === 'rejected').length,
      expiring_soon: members.filter(m => {
        if (!m.membership_end_date || m.status !== 'approved') return false;
        const endDate = new Date(m.membership_end_date);
        return endDate > today && endDate <= thirtyDaysLater;
      }).length,
      expired: members.filter(m => {
        if (!m.membership_end_date || m.status !== 'approved') return false;
        const endDate = new Date(m.membership_end_date);
        return endDate < today;
      }).length,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSimpleDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-electric-blue" />
      </div>
    );
  }

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-electric-blue" />
                {t('admin.members.title')}
              </CardTitle>
              <CardDescription className="text-white/60">
                {t('admin.members.subtitle')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('admin.addMember.button')}
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting || members.length === 0}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('admin.members.exporting')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('admin.members.exportCSV')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or artist name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/50"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-white/50 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px] bg-black/40 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-deep-purple border-white/10">
                  <SelectItem value="all" className="text-white">{t('admin.filter.all')} ({counts.total})</SelectItem>
                  <SelectItem value="pending" className="text-white">{t('admin.filter.pending')} ({counts.pending})</SelectItem>
                  <SelectItem value="approved" className="text-white">{t('admin.filter.approved')} ({counts.approved})</SelectItem>
                  <SelectItem value="rejected" className="text-white">{t('admin.filter.rejected')} ({counts.rejected})</SelectItem>
                  <SelectItem value="expiring_soon" className="text-yellow-400">{t('admin.filter.expiringSoon')} ({counts.expiring_soon})</SelectItem>
                  <SelectItem value="expired" className="text-red-400">{t('admin.filter.expired')} ({counts.expired})</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <Card className="bg-black/60 border-white/10 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">City</Label>
                    <Input
                      type="text"
                      placeholder="Filter by city..."
                      value={filters.city}
                      onChange={(e) => setFilters({...filters, city: e.target.value})}
                      className="bg-black/40 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Membership Type</Label>
                    <Select value={filters.membershipType} onValueChange={(value) => setFilters({...filters, membershipType: value})}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-deep-purple border-white/10">
                        <SelectItem value="all" className="text-white">All Types</SelectItem>
                        <SelectItem value="in_progress" className="text-white">{t('admin.membership.inProgress')}</SelectItem>
                        <SelectItem value="yearly" className="text-white">{t('admin.membership.yearly')}</SelectItem>
                        <SelectItem value="lifetime" className="text-white">{t('admin.membership.lifetime')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Payment Status</Label>
                    <Select value={filters.paymentStatus} onValueChange={(value) => setFilters({...filters, paymentStatus: value})}>
                      <SelectTrigger className="bg-black/40 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-deep-purple border-white/10">
                        <SelectItem value="all" className="text-white">All</SelectItem>
                        <SelectItem value="paid" className="text-white">Paid</SelectItem>
                        <SelectItem value="unpaid" className="text-white">Unpaid</SelectItem>
                        <SelectItem value="overdue" className="text-white">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label className="text-white text-sm">Roles</Label>
                  <div className="flex flex-wrap gap-4">
                    {['dj', 'producer', 'vj', 'visual_artist', 'fan'].map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={filters.roles.includes(role)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({...filters, roles: [...filters.roles, role]});
                            } else {
                              setFilters({...filters, roles: filters.roles.filter(r => r !== role)});
                            }
                          }}
                        />
                        <Label htmlFor={`role-${role}`} className="text-white text-sm capitalize cursor-pointer">
                          {role.replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilters({ city: '', membershipType: 'all', paymentStatus: 'all', roles: [] });
                      setSearchQuery('');
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}

            {/* Bulk Actions */}
            {selectedMembers.length > 0 && (
              <Card className="bg-blue-500/10 border-blue-500/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-semibold">
                      {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={isBulkActioning}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkReject}
                      disabled={isBulkActioning}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkExport}
                      disabled={isBulkActioning}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedMembers([])}
                      className="text-white/70 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{members.length === 0 ? t('admin.members.noMembers') : `No ${statusFilter} members`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMembers(filteredMembers.map(m => m.id));
                          } else {
                            setSelectedMembers([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.name')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.email')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.status')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.membership')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.newsletter')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.expires')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.payment')}</TableHead>
                    <TableHead className="text-white/80">{t('admin.members.table.amount')}</TableHead>
                    <TableHead className="text-white/80 text-right">{t('admin.members.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <>
                      {/* Roles Row */}
                      {(member.is_dj || member.is_producer || member.is_vj || member.is_visual_artist || member.is_fan) && (
                        <TableRow key={`${member.id}-roles`} className="border-white/5 hover:bg-white/5">
                          <TableCell></TableCell>
                          <TableCell className="text-white">
                            <div className="font-medium">{member.first_name} {member.second_name && `${member.second_name} `}{member.last_name}</div>
                            {member.artist_name && <div className="text-sm text-electric-blue">"{member.artist_name}"</div>}
                            <div className="text-xs text-white/40">{member.city}</div>
                          </TableCell>
                          <TableCell colSpan={9}>
                            <div className="flex gap-1 flex-wrap">
                              {member.is_dj && <span className="text-xs bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded">DJ</span>}
                              {member.is_producer && <span className="text-xs bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded">Producer</span>}
                              {member.is_vj && <span className="text-xs bg-pink-600/30 text-pink-300 px-1.5 py-0.5 rounded">VJ</span>}
                              {member.is_visual_artist && <span className="text-xs bg-green-600/30 text-green-300 px-1.5 py-0.5 rounded">Visual Artist</span>}
                              {member.is_fan && <span className="text-xs bg-yellow-600/30 text-yellow-300 px-1.5 py-0.5 rounded">Fan</span>}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Main Data Row */}
                      <TableRow key={member.id} className="border-white/10 hover:bg-white/5">
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMembers([...selectedMembers, member.id]);
                              } else {
                                setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-white">
                          {!(member.is_dj || member.is_producer || member.is_vj || member.is_visual_artist || member.is_fan) && (
                            <>
                              <div className="font-medium">{member.first_name} {member.second_name && `${member.second_name} `}{member.last_name}</div>
                              {member.artist_name && <div className="text-sm text-electric-blue">"{member.artist_name}"</div>}
                              <div className="text-xs text-white/40">{member.city}</div>
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-white/80 text-sm">{member.email}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>{getMembershipTypeBadge(member.membership_type)}</TableCell>
                        <TableCell>
                          {member.newsletter_subscribe ? (
                            <CheckCircle className="h-4 w-4 text-green-400" title={t('admin.members.newsletterYes')} />
                          ) : (
                            <XCircle className="h-4 w-4 text-white/40" title={t('admin.members.newsletterNo')} />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-white/80 text-sm">{formatSimpleDate(member.membership_end_date)}</span>
                            {member.status === 'approved' && getExpirationWarning(member.membership_end_date)}
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(member.payment_status)}</TableCell>
                        <TableCell className="text-white/80">
                          {member.payment_amount ? `€${parseFloat(member.payment_amount.toString()).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => handleEditMembership(member)}
                              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              {t('admin.status.manage')}
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleSetPassword(member)}
                              disabled={settingPasswordFor === member.id}
                              variant="outline"
                              className="border-yellow-500 text-yellow-500 hover:bg-yellow-500/20"
                              title={t('admin.members.setPassword')}
                            >
                              {settingPasswordFor === member.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Key className="h-3 w-3" />
                              )}
                            </Button>
                            
                            {memberToDelete?.id === member.id ? (
                              <Button
                                size="sm"
                                onClick={() => handleDeleteMember(member)}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    {t('admin.members.confirmDelete')}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setMemberToDelete(member)}
                                variant="outline"
                                className="border-red-400 text-red-400 hover:bg-red-400/20"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            {member.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(member.id, 'approved')}
                                disabled={updatingStatus === member.id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {updatingStatus === member.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {t('admin.status.approve')}
                                  </>
                                )}
                              </Button>
                            )}
                            {member.status !== 'rejected' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(member.id, 'rejected')}
                                disabled={updatingStatus === member.id}
                                variant="destructive"
                              >
                                {updatingStatus === member.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {t('admin.status.reject')}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          {member.status === 'approved' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/5"
                              onClick={() => handleResendApprovalEmail(member)}
                              disabled={resendingApprovalFor === member.id}
                              title={t('admin.members.resendApprovalEmailTitle')}
                            >
                              {resendingApprovalFor === member.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3 mr-1" />
                              )}
                              {t('admin.members.resendApprovalEmail')}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    </>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-white/60 text-sm flex items-center justify-between">
                <span>{t('admin.members.showing')} {filteredMembers.length} {t('admin.members.of')} {members.length} {t('admin.members.members')}</span>
                {counts.expiring_soon > 0 && (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {counts.expiring_soon} {t('admin.expiry.expiringSoon')}
                  </span>
                )}
                {counts.expired > 0 && (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {counts.expired} {t('admin.expiry.expiredCount')}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MembershipDialog
        member={selectedMember}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchMembers}
      />

      <AddMemberDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchMembers}
      />

      <AlertDialog open={generatedPassword !== null} onOpenChange={() => setGeneratedPassword(null)}>
        <AlertDialogContent className="bg-black/95 border-electric-blue/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl text-electric-blue">
              {t('admin.members.passwordGenerated')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 space-y-4">
              <p>{t('admin.members.passwordGeneratedFor', { name: generatedPassword?.memberName || '' })}</p>
              
              <div className="bg-black/60 p-4 rounded-lg border border-electric-blue/30">
                <p className="text-sm text-white/60 mb-2">{t('admin.members.emailLabel')}</p>
                <p className="text-lg font-medium text-white mb-4">{generatedPassword?.memberEmail}</p>
                
                <p className="text-sm text-white/60 mb-2">{t('admin.members.temporaryPassword')}</p>
                <p className="text-2xl font-mono font-bold text-electric-blue tracking-wider">
                  {generatedPassword?.password}
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  ⚠️ {t('admin.members.passwordWarning')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(generatedPassword?.password || '');
                toast({
                  title: t('admin.message.success'),
                  description: t('admin.members.passwordCopied'),
                });
              }}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              {t('admin.members.copyPassword')}
            </Button>
            <Button
              onClick={() => setGeneratedPassword(null)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              {t('common.close')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MembersManager;

