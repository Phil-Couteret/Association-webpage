import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FEATURE_TAX_DEDUCTION_UI } from "@/config/features";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
  artist_name?: string | null;
  is_dj?: boolean;
  is_producer?: boolean;
  is_vj?: boolean;
  is_visual_artist?: boolean;
  is_fan?: boolean;
  newsletter_subscribe?: boolean;
  membership_type?: string;
  membership_start_date?: string;
  membership_end_date?: string;
  payment_status?: string;
  last_payment_date?: string;
  payment_amount?: string | number;
  payment_method?: string;
  notes?: string;
}

interface Payment {
  id: number;
  transaction_id: string;
  gateway: string;
  amount: number;
  currency: string;
  status: string;
  membership_type: string;
  membership_start_date: string | null;
  membership_end_date: string | null;
  payment_method: string | null;
  created_at: string;
}

interface MembershipDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MembershipDialog = ({ member, open, onOpenChange, onSuccess }: MembershipDialogProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState<Partial<Payment>>({});
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingTaxTest, setIsSendingTaxTest] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    country: '',
    artist_name: '',
    is_dj: false,
    is_producer: false,
    is_vj: false,
    is_visual_artist: false,
    is_fan: false,
    newsletter_subscribe: true,
    membership_type: '',
    membership_start_date: '',
    membership_end_date: '',
    payment_status: '',
    last_payment_date: '',
    payment_amount: '',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({
        email: member.email || '',
        phone: member.phone || '',
        country: member.country || '',
        artist_name: member.artist_name || '',
        // Convert to boolean explicitly - handle both number (0/1) and boolean (true/false) from API
        is_dj: Boolean(member.is_dj),
        is_producer: Boolean(member.is_producer),
        is_vj: Boolean(member.is_vj),
        is_visual_artist: Boolean(member.is_visual_artist),
        is_fan: Boolean(member.is_fan),
        newsletter_subscribe: Boolean(member.newsletter_subscribe ?? true),
        membership_type: member.membership_type || 'in_progress',
        membership_start_date: member.membership_start_date || '',
        membership_end_date: member.membership_end_date || '',
        payment_status: member.payment_status || 'unpaid',
        last_payment_date: member.last_payment_date || '',
        payment_amount: member.payment_amount?.toString() || '',
        payment_method: member.payment_method || '',
        notes: member.notes || ''
      });
    }
  }, [member]);

  useEffect(() => {
    if (open && member?.id) {
      fetchPayments();
    } else {
      setPayments([]);
    }
  }, [open, member?.id]);

  const fetchPayments = async () => {
    if (!member?.id) return;
    setPaymentsLoading(true);
    try {
      const res = await fetch(`/api/member-payments-admin.php?member_id=${member.id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPayments(data.payments || []);
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleEditPayment = (p: Payment) => {
    setEditPayment(p);
    setEditForm({
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      membership_type: p.membership_type,
      membership_start_date: p.membership_start_date || undefined,
      membership_end_date: p.membership_end_date || undefined,
      payment_method: p.payment_method || undefined,
    });
  };

  const handleSaveEdit = async () => {
    if (!editPayment) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/member-payments-admin.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editPayment.id,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.message.success'), description: 'Payment updated' });
        setEditPayment(null);
        fetchPayments();
        onSuccess();
      } else throw new Error(data.error);
    } catch (e) {
      toast({ title: t('admin.message.error'), description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/member-payments-admin.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleteTarget.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t('admin.message.success'), description: 'Payment deleted' });
        setDeleteTarget(null);
        fetchPayments();
        onSuccess();
      } else throw new Error(data.error);
    } catch (e) {
      toast({ title: t('admin.message.error'), description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : '-');
  const formatAmount = (a: number, c: string) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: c || 'EUR' }).format(a);

  const handleSendTaxReceiptTest = async () => {
    if (!member?.id) return;
    setIsSendingTaxTest(true);
    try {
      const res = await fetch(`/api/tax-receipt-test.php?member_id=${member.id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: data.message });
      } else {
        toast({ title: 'Failed', description: data.error || JSON.stringify(data.log), variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: String(e), variant: 'destructive' });
    } finally {
      setIsSendingTaxTest(false);
    }
  };

  const handleQuickRenewal = (months: number) => {
    const today = new Date();
    const endDate = new Date(formData.membership_end_date || today);
    
    // If membership already expired or not set, start from today
    const startDate = endDate < today || !formData.membership_end_date ? today : endDate;
    
    const newEndDate = new Date(startDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);
    
    setFormData({
      ...formData,
      membership_start_date: formData.membership_start_date || today.toISOString().split('T')[0],
      membership_end_date: newEndDate.toISOString().split('T')[0],
      payment_status: 'paid',
      last_payment_date: today.toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/members-update-membership.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: member.id,
          ...formData,
          payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : null,
          payment_method: formData.payment_method || null
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('admin.message.success'),
          description: t('admin.message.membershipUpdated'),
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Failed to update membership');
      }
    } catch (error) {
      toast({
        title: t('admin.message.error'),
        description: error instanceof Error ? error.message : t('admin.message.updateError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-deep-purple border-white/10 text-white max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('admin.dialog.title')}: {member.first_name} {member.last_name}</DialogTitle>
          <DialogDescription className="text-white/60">
            {member.email}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact & Identity Info */}
          <div className="space-y-3 border-b border-white/10 pb-3">
            <h3 className="text-sm font-semibold text-white/80">{t('admin.addMember.personalInfo')}</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('admin.addMember.email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t('admin.addMember.phone')}</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder="Spain, France, etc."
              />
              <p className="text-white/50 text-xs">
                {FEATURE_TAX_DEDUCTION_UI
                  ? "Required for tax receipt (Spain residents only)"
                  : "Helps us apply the correct regional settings"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.addMember.artistName')}</Label>
              <Input
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder={t('admin.addMember.artistNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.addMember.roles')}</Label>
              <div className="grid grid-cols-5 gap-2">
                <label className="flex items-center space-x-2 cursor-pointer bg-black/20 p-2 rounded border border-white/10 hover:border-electric-blue/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_dj}
                    onChange={(e) => setFormData({ ...formData, is_dj: e.target.checked })}
                    className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                  />
                  <span className="text-sm text-white">DJ</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-black/20 p-2 rounded border border-white/10 hover:border-electric-blue/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_producer}
                    onChange={(e) => setFormData({ ...formData, is_producer: e.target.checked })}
                    className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                  />
                  <span className="text-sm text-white">{t('admin.addMember.producer')}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-black/20 p-2 rounded border border-white/10 hover:border-electric-blue/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_vj}
                    onChange={(e) => setFormData({ ...formData, is_vj: e.target.checked })}
                    className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                  />
                  <span className="text-sm text-white">VJ</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-black/20 p-2 rounded border border-white/10 hover:border-electric-blue/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_visual_artist}
                    onChange={(e) => setFormData({ ...formData, is_visual_artist: e.target.checked })}
                    className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                  />
                  <span className="text-sm text-white">{t('admin.addMember.visualArtist')}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-black/20 p-2 rounded border border-white/10 hover:border-electric-blue/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_fan}
                    onChange={(e) => setFormData({ ...formData, is_fan: e.target.checked })}
                    className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                  />
                  <span className="text-sm text-white">{t('admin.addMember.fan')}</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer bg-black/20 p-2 rounded border border-white/10 hover:border-electric-blue/50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.newsletter_subscribe}
                  onChange={(e) => setFormData({ ...formData, newsletter_subscribe: e.target.checked })}
                  className="rounded border-white/20 text-electric-blue focus:ring-electric-blue"
                />
                <span className="text-sm text-white">{t('admin.members.newsletter')}</span>
              </label>
            </div>
          </div>

          {/* Membership Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80">{t('admin.addMember.membershipDetails')}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.dialog.membershipType')}</Label>
              <Select value={formData.membership_type} onValueChange={(value) => setFormData({ ...formData, membership_type: value })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-purple border-white/10">
                  <SelectItem value="in_progress" className="text-white">{t('admin.membership.inProgress')}</SelectItem>
                  <SelectItem value="yearly" className="text-white">{t('admin.membership.yearly')}</SelectItem>
                  <SelectItem value="lifetime" className="text-white">{t('admin.membership.lifetime')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.dialog.paymentStatus')}</Label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-deep-purple border-white/10">
                  <SelectItem value="unpaid" className="text-white">{t('admin.payment.unpaid')}</SelectItem>
                  <SelectItem value="paid" className="text-white">{t('admin.payment.paid')}</SelectItem>
                  <SelectItem value="overdue" className="text-white">{t('admin.payment.overdue')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.dialog.quickRenewal')}</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickRenewal(1)} className="border-electric-blue text-electric-blue">
                {t('admin.dialog.month1')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickRenewal(3)} className="border-electric-blue text-electric-blue">
                {t('admin.dialog.month3')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickRenewal(6)} className="border-electric-blue text-electric-blue">
                {t('admin.dialog.month6')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleQuickRenewal(12)} className="border-electric-blue text-electric-blue">
                {t('admin.dialog.year1')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.dialog.startDate')}</Label>
              <Input
                type="date"
                value={formData.membership_start_date}
                onChange={(e) => setFormData({ ...formData, membership_start_date: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.dialog.endDate')}</Label>
              <Input
                type="date"
                value={formData.membership_end_date}
                onChange={(e) => setFormData({ ...formData, membership_end_date: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.dialog.lastPayment')}</Label>
              <Input
                type="date"
                value={formData.last_payment_date}
                onChange={(e) => setFormData({ ...formData, last_payment_date: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.dialog.amount')} (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.payment_amount}
                onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.dialog.paymentMethod', 'Payment method')}</Label>
            <Select value={formData.payment_method || 'other'} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white">
                <SelectValue placeholder={t('admin.dialog.selectPaymentMethod', 'Select how they paid')} />
              </SelectTrigger>
              <SelectContent className="bg-deep-purple border-white/10">
                <SelectItem value="stripe" className="text-white">Stripe (card)</SelectItem>
                <SelectItem value="cash" className="text-white">Cash</SelectItem>
                <SelectItem value="wire_transfer" className="text-white">Wire / Bank transfer</SelectItem>
                <SelectItem value="paycomet" className="text-white">Paycomet</SelectItem>
                <SelectItem value="other" className="text-white">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-white/50 text-xs">{t('admin.dialog.paymentMethodHelp', 'Record how they paid (for pre-Stripe payments)')}</p>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.dialog.notes')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-black/40 border-white/10 text-white min-h-[80px]"
              placeholder={t('admin.dialog.notesPlaceholder')}
            />
          </div>

          {/* Payment History - modify/delete older payments */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80">Payment history</h3>
              {FEATURE_TAX_DEDUCTION_UI &&
                formData.country &&
                /spain|españa|es|catalonia/i.test(formData.country) && (
                <Button type="button" variant="outline" size="sm" onClick={handleSendTaxReceiptTest} disabled={isSendingTaxTest} className="border-electric-blue text-electric-blue text-xs">
                  {isSendingTaxTest ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sending</> : 'Send tax receipt test'}
                </Button>
              )}
            </div>
            {paymentsLoading ? (
              <div className="text-white/50 text-sm py-4">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="text-white/50 text-sm py-2">No payment records yet. Add a payment above and save.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 bg-black/20 rounded p-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="text-white font-medium">{formatAmount(p.amount, p.currency)}</span>
                      <span className="text-white/60 ml-2">{formatDate(p.created_at)}</span>
                      <span className="text-white/50 ml-2">({p.payment_method || p.gateway})</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white" onClick={() => handleEditPayment(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-red-400" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-white/10">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/10">
            {t('admin.dialog.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            onClick={(e) => {
              e.preventDefault();
              const form = document.querySelector('form') as HTMLFormElement;
              form?.requestSubmit();
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('admin.dialog.saving')}
              </>
            ) : (
              t('admin.dialog.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Payment Dialog */}
    <Dialog open={!!editPayment} onOpenChange={(o) => !o && setEditPayment(null)}>
      <DialogContent className="bg-deep-purple border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Edit payment</DialogTitle>
          <DialogDescription className="text-white/60">Modify amount, dates, or method</DialogDescription>
        </DialogHeader>
        {editPayment && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (€)</Label>
                <Input type="number" step="0.01" value={editForm.amount ?? ''} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} className="bg-black/40 border-white/10 text-white" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status ?? 'completed'} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-deep-purple border-white/10">
                    <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    <SelectItem value="pending" className="text-white">Pending</SelectItem>
                    <SelectItem value="refunded" className="text-white">Refunded</SelectItem>
                    <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input type="date" value={editForm.membership_start_date ?? ''} onChange={(e) => setEditForm({ ...editForm, membership_start_date: e.target.value || undefined })} className="bg-black/40 border-white/10 text-white" />
              </div>
              <div>
                <Label>End date</Label>
                <Input type="date" value={editForm.membership_end_date ?? ''} onChange={(e) => setEditForm({ ...editForm, membership_end_date: e.target.value || undefined })} className="bg-black/40 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <Label>Payment method</Label>
              <Select value={editForm.payment_method ?? 'other'} onValueChange={(v) => setEditForm({ ...editForm, payment_method: v })}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-deep-purple border-white/10">
                  <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                  <SelectItem value="cash" className="text-white">Cash</SelectItem>
                  <SelectItem value="wire_transfer" className="text-white">Wire transfer</SelectItem>
                  <SelectItem value="paycomet" className="text-white">Paycomet</SelectItem>
                  <SelectItem value="other" className="text-white">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditPayment(null)} className="border-white/10">Cancel</Button>
          <Button onClick={handleSaveEdit} disabled={isUpdating} className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple">
            {isUpdating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving</> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete confirmation */}
    <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !isDeleting && setDeleteTarget(null)}>
      <AlertDialogContent className="bg-deep-purple border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete payment?</AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            {deleteTarget && `This will remove the payment of ${formatAmount(deleteTarget.amount, deleteTarget.currency)} from ${formatDate(deleteTarget.created_at)}. Member summary will be updated.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10" disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDeletePayment(); }} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
            {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting</> : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default MembershipDialog;

