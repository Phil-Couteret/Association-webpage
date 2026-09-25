import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, Loader2, CheckCircle, XCircle, Clock, CreditCard, Calendar, Edit, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MembershipDialog from "./MembershipDialog";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  second_name: string | null;
  email: string;
  phone: string;
  street: string | null;
  zip_code: string | null;
  city: string;
  country: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // Apply status filter
    if (statusFilter === 'all') {
      setFilteredMembers(members);
    } else if (statusFilter === 'expiring_soon') {
      // Show members expiring in the next 30 days
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      setFilteredMembers(members.filter(m => {
        if (!m.membership_end_date) return false;
        const endDate = new Date(m.membership_end_date);
        return endDate > today && endDate <= thirtyDaysLater && m.status === 'approved';
      }));
    } else if (statusFilter === 'expired') {
      // Show members with expired memberships
      const today = new Date();
      setFilteredMembers(members.filter(m => {
        if (!m.membership_end_date) return false;
        const endDate = new Date(m.membership_end_date);
        return endDate < today && m.status === 'approved';
      }));
    } else {
      setFilteredMembers(members.filter(m => m.status === statusFilter));
    }
  }, [members, statusFilter]);

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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load members",
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
        title: "Success",
        description: "Members list exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export members",
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
          title: "Success",
          description: `Member ${newStatus} successfully`,
        });
        fetchMembers();
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update member status",
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMembershipTypeBadge = (type?: string) => {
    if (!type) return <span className="text-white/40">-</span>;
    
    const config: Record<string, { label: string, color: string }> = {
      in_progress: { label: 'In Progress', color: 'bg-gray-500' },
      yearly: { label: 'Yearly', color: 'bg-purple-500' },
      lifetime: { label: 'Lifetime', color: 'bg-green-500' }
    };
    
    const { label, color } = config[type] || { label: type, color: 'bg-gray-500' };
    
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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getExpirationWarning = (endDate?: string) => {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return <span className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Expired</span>;
    } else if (daysUntilExpiry <= 7) {
      return <span className="text-orange-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {daysUntilExpiry} days left</span>;
    } else if (daysUntilExpiry <= 30) {
      return <span className="text-yellow-400 text-xs">Expires in {daysUntilExpiry} days</span>;
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
                Membership Management
              </CardTitle>
              <CardDescription className="text-white/60">
                Manage member registrations, payments, and membership renewals
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px] bg-black/40 border-white/10 text-white">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent className="bg-deep-purple border-white/10">
                  <SelectItem value="all" className="text-white">All Members ({counts.total})</SelectItem>
                  <SelectItem value="pending" className="text-white">Pending ({counts.pending})</SelectItem>
                  <SelectItem value="approved" className="text-white">Approved ({counts.approved})</SelectItem>
                  <SelectItem value="rejected" className="text-white">Rejected ({counts.rejected})</SelectItem>
                  <SelectItem value="expiring_soon" className="text-yellow-400">Expiring Soon ({counts.expiring_soon})</SelectItem>
                  <SelectItem value="expired" className="text-red-400">Expired ({counts.expired})</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleExport}
                disabled={isExporting || members.length === 0}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{members.length === 0 ? 'No members registered yet' : `No ${statusFilter} members`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/80">Name</TableHead>
                    <TableHead className="text-white/80">Email</TableHead>
                    <TableHead className="text-white/80">Status</TableHead>
                    <TableHead className="text-white/80">Membership</TableHead>
                    <TableHead className="text-white/80">Expires</TableHead>
                    <TableHead className="text-white/80">Payment</TableHead>
                    <TableHead className="text-white/80">Amount</TableHead>
                    <TableHead className="text-white/80 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white">
                        <div>
                          <div>{member.first_name} {member.second_name && `${member.second_name} `}{member.last_name}</div>
                          <div className="text-xs text-white/40">{member.city}, {member.country}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/80 text-sm">{member.email}</TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>{getMembershipTypeBadge(member.membership_type)}</TableCell>
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditMembership(member)}
                            className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
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
                                  Approve
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
                                  Reject
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-white/60 text-sm flex items-center justify-between">
                <span>Showing {filteredMembers.length} of {members.length} members</span>
                {counts.expiring_soon > 0 && (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {counts.expiring_soon} membership{counts.expiring_soon !== 1 ? 's' : ''} expiring soon
                  </span>
                )}
                {counts.expired > 0 && (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {counts.expired} expired membership{counts.expired !== 1 ? 's' : ''}
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
    </div>
  );
};

export default MembersManager;






