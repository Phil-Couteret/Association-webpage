import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Mail, Send, Clock, CheckCircle, XCircle, AlertCircle, PlayCircle, RefreshCw, Edit, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

interface EmailStats {
  template_key: string;
  total: number;
  sent: number;
  failed: number;
}

interface QueueStatus {
  status: string;
  priority: string;
  count: number;
  next_scheduled: string | null;
}

interface RecentEmail {
  id: number;
  email: string;
  first_name: string | null;
  second_name: string | null;
  subject: string;
  template_key: string | null;
  status: string;
  sent_at: string;
}

interface AutomationRule {
  id: number;
  rule_name: string;
  trigger_type: string;
  template_name: string;
  template_key: string;
  days_offset: number;
  active: boolean;
}

interface EmailTemplate {
  id: number;
  template_key: string;
  name: string;
  subject_en: string;
  subject_es: string;
  subject_ca: string;
  body_en: string;
  body_es: string;
  body_ca: string;
  active: boolean;
}

export default function EmailAutomationManager() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<EmailStats[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus[]>([]);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [processingQueue, setProcessingQueue] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    template_key: '',
    name: '',
    subject_en: '',
    subject_es: '',
    subject_ca: '',
    body_en: '',
    body_es: '',
    body_ca: '',
    active: true
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Sync form when editing template changes
  useEffect(() => {
    if (editingTemplate && templateDialogOpen) {
      const activeValue = typeof editingTemplate.active === 'boolean' 
        ? editingTemplate.active 
        : editingTemplate.active === 1 || editingTemplate.active === '1' || editingTemplate.active === true;
      
      const formData = {
        template_key: editingTemplate.template_key ?? '',
        name: editingTemplate.name ?? '',
        subject_en: editingTemplate.subject_en ?? '',
        subject_es: editingTemplate.subject_es ?? '',
        subject_ca: editingTemplate.subject_ca ?? '',
        body_en: editingTemplate.body_en ?? '',
        body_es: editingTemplate.body_es ?? '',
        body_ca: editingTemplate.body_ca ?? '',
        active: activeValue
      };
      
      setTemplateForm(formData);
    }
  }, [editingTemplate, templateDialogOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, templatesRes] = await Promise.all([
        fetch('/api/email-automation-stats.php', { credentials: 'include' }),
        fetch('/api/email-templates-list.php', { credentials: 'include' })
      ]);

      if (!statsRes.ok || !templatesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const statsData = await statsRes.json();
      const templatesData = await templatesRes.json();

      if (statsData.success) {
        setStats(statsData.statistics || []);
        setQueueStatus(statsData.queue_status || []);
        setRecentEmails(statsData.recent_emails || []);
        setRules(statsData.automation_rules || []);
      }

      if (templatesData.success) {
        // Convert active field from 0/1 to boolean if needed
        const processedTemplates = (templatesData.templates || []).map((t: any) => ({
          ...t,
          active: t.active === 1 || t.active === true || t.active === '1'
        }));
        setTemplates(processedTemplates);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runCronManually = async () => {
    try {
      setProcessingQueue(true);
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/test-manual-trigger.php', {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to run automation');
      }

      const data = await res.json();
      
      if (data.success) {
        const sent = data.queue_processing?.sent || 0;
        const reminders = data.expiring_memberships?.['7d'] || 0;
        setSuccess(t('emailAutomation.cronRunSuccess', `Processed ${sent} emails, ${reminders} expiration reminders sent`));
        await fetchData();
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProcessingQueue(false);
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    // Convert active from 0/1 to boolean if needed
    const activeValue = typeof template.active === 'boolean' 
      ? template.active 
      : template.active === 1 || template.active === '1' || template.active === true;
    
    const formData = {
      template_key: String(template.template_key || ''),
      name: String(template.name || ''),
      subject_en: String(template.subject_en || ''),
      subject_es: String(template.subject_es || ''),
      subject_ca: String(template.subject_ca || ''),
      body_en: String(template.body_en || ''),
      body_es: String(template.body_es || ''),
      body_ca: String(template.body_ca || ''),
      active: activeValue
    };
    
    // Set state in correct order - form first, then template, then open dialog
    setTemplateForm(formData);
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      template_key: '',
      name: '',
      subject_en: '',
      subject_es: '',
      subject_ca: '',
      body_en: '',
      body_es: '',
      body_ca: '',
      active: true
    });
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.template_key || !templateForm.name || !templateForm.subject_en || !templateForm.body_en) {
      setError('Template key, name, subject (EN), and body (EN) are required');
      return;
    }

    try {
      setSavingTemplate(true);
      setError(null);
      setSuccess(null);

      const url = editingTemplate 
        ? '/api/email-templates-update.php'
        : '/api/email-templates-create.php';
      
      const method = editingTemplate ? 'POST' : 'POST';
      const body = editingTemplate
        ? { ...templateForm, id: editingTemplate.id }
        : templateForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save template');
      }

      setSuccess(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
      setTemplateDialogOpen(false);
      await fetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/email-templates-delete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: templateId })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete template');
      }

      setSuccess('Template deleted successfully');
      await fetchData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate) {
      setError(t('emailAutomation.selectTemplate', 'Please select a template'));
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const res = await fetch('/api/email-test-send.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ template_key: selectedTemplate })
      });

      if (!res.ok) {
        throw new Error('Failed to send test email');
      }

      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message);
        setTestDialogOpen(false);
        await fetchData();
      } else {
        throw new Error(data.error || 'Unknown error');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTriggerTypeLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      'member_registered': t('emailAutomation.triggerRegistered', 'Member Registered'),
      'member_approved': t('emailAutomation.triggerApproved', 'Member Approved'),
      'member_rejected': t('emailAutomation.triggerRejected', 'Member Rejected'),
      'membership_expiring_7d': t('emailAutomation.triggerExpiring7d', 'Expiring in 7 Days'),
      'membership_expiring_3d': t('emailAutomation.triggerExpiring3d', 'Expiring in 3 Days'),
      'membership_expiring_1d': t('emailAutomation.triggerExpiring1d', 'Expiring in 1 Day'),
      'membership_expired': t('emailAutomation.triggerExpired', 'Membership Expired'),
      'membership_renewed': t('emailAutomation.triggerRenewed', 'Membership Renewed'),
      'sponsor_tax_receipt': t('emailAutomation.triggerTaxReceipt', 'Tax Receipt (Sponsor)')
    };
    return labels[triggerType] || triggerType;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">{t('common.loading', 'Loading...')}</div>;
  }

  // Calculate totals
  const totalSent = stats.reduce((sum, s) => sum + parseInt(s.sent.toString()), 0);
  const totalFailed = stats.reduce((sum, s) => sum + parseInt(s.failed.toString()), 0);
  const pendingInQueue = queueStatus.filter(q => q.status === 'pending').reduce((sum, q) => sum + parseInt(q.count.toString()), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('emailAutomation.title', 'Email Automation')}</h2>
          <p className="text-muted-foreground">{t('emailAutomation.description', 'Manage automated email campaigns and notifications')}</p>
        </div>
        <div className="space-x-2">
          <Button onClick={() => setTestDialogOpen(true)} variant="outline">
            <Send className="mr-2 h-4 w-4" />
            {t('emailAutomation.sendTest', 'Send Test')}
          </Button>
          <Button onClick={runCronManually} disabled={processingQueue}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {processingQueue ? t('emailAutomation.processing', 'Processing...') : t('emailAutomation.runNow', 'Run Now')}
          </Button>
          <Button onClick={fetchData} variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('emailAutomation.statsSent', 'Emails Sent')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground">{t('emailAutomation.statsLast30Days', 'Last 30 days')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('emailAutomation.statsPending', 'Pending in Queue')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInQueue}</div>
            <p className="text-xs text-muted-foreground">{t('emailAutomation.statsWaitingSend', 'Waiting to be sent')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('emailAutomation.statsFailed', 'Failed')}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">{t('emailAutomation.statsLast30Days', 'Last 30 days')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">{t('emailAutomation.tabRecent', 'Recent Emails')}</TabsTrigger>
          <TabsTrigger value="queue">{t('emailAutomation.tabQueue', 'Queue Status')}</TabsTrigger>
          <TabsTrigger value="rules">{t('emailAutomation.tabRules', 'Automation Rules')}</TabsTrigger>
          <TabsTrigger value="templates">{t('emailAutomation.tabTemplates', 'Templates')}</TabsTrigger>
        </TabsList>

        {/* Recent Emails */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>{t('emailAutomation.recentEmailsTitle', 'Recent Emails')}</CardTitle>
              <CardDescription>{t('emailAutomation.recentEmailsDesc', 'Last 50 sent emails')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('emailAutomation.colStatus', 'Status')}</TableHead>
                    <TableHead>{t('emailAutomation.colRecipient', 'Recipient')}</TableHead>
                    <TableHead>{t('emailAutomation.colSubject', 'Subject')}</TableHead>
                    <TableHead>{t('emailAutomation.colTemplate', 'Template')}</TableHead>
                    <TableHead>{t('emailAutomation.colSent', 'Sent At')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEmails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {t('emailAutomation.noEmails', 'No emails sent yet')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentEmails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell>{getStatusIcon(email.status)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {email.first_name && email.second_name
                                ? `${email.first_name} ${email.second_name}`
                                : email.email}
                            </div>
                            {email.first_name && <div className="text-sm text-muted-foreground">{email.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                        <TableCell>
                          {email.template_key && (
                            <Badge variant="outline">{email.template_key}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(email.sent_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queue Status */}
        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>{t('emailAutomation.queueTitle', 'Email Queue')}</CardTitle>
              <CardDescription>{t('emailAutomation.queueDesc', 'Current status of email queue')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('emailAutomation.colStatus', 'Status')}</TableHead>
                    <TableHead>{t('emailAutomation.colPriority', 'Priority')}</TableHead>
                    <TableHead>{t('emailAutomation.colCount', 'Count')}</TableHead>
                    <TableHead>{t('emailAutomation.colNextScheduled', 'Next Scheduled')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {t('emailAutomation.queueEmpty', 'Queue is empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    queueStatus.map((q, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(q.status)}
                            <span className="capitalize">{q.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={q.priority === 'high' ? 'destructive' : q.priority === 'normal' ? 'default' : 'secondary'}>
                            {q.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{q.count}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {q.next_scheduled ? new Date(q.next_scheduled).toLocaleString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Rules */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>{t('emailAutomation.rulesTitle', 'Automation Rules')}</CardTitle>
              <CardDescription>{t('emailAutomation.rulesDesc', 'Configured email automation triggers')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('emailAutomation.colRule', 'Rule')}</TableHead>
                    <TableHead>{t('emailAutomation.colTrigger', 'Trigger')}</TableHead>
                    <TableHead>{t('emailAutomation.colTemplate', 'Template')}</TableHead>
                    <TableHead>{t('emailAutomation.colTiming', 'Timing')}</TableHead>
                    <TableHead>{t('emailAutomation.colStatus', 'Status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.rule_name}</TableCell>
                      <TableCell>{getTriggerTypeLabel(rule.trigger_type)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.template_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.days_offset === 0
                          ? t('emailAutomation.timingImmediate', 'Immediate')
                          : rule.days_offset < 0
                          ? t('emailAutomation.timingDaysBefore', `${Math.abs(rule.days_offset)} days before`)
                          : t('emailAutomation.timingDaysAfter', `${rule.days_offset} days after`)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? t('emailAutomation.statusActive', 'Active') : t('emailAutomation.statusInactive', 'Inactive')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('emailAutomation.templatesTitle', 'Email Templates')}</CardTitle>
                  <CardDescription>{t('emailAutomation.templatesDesc', 'Available email templates')}</CardDescription>
                </div>
                <Button onClick={handleNewTemplate} className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('emailAutomation.colTemplate', 'Template')}</TableHead>
                    <TableHead>{t('emailAutomation.colKey', 'Key')}</TableHead>
                    <TableHead>{t('emailAutomation.colSubject', 'Subject (EN)')}</TableHead>
                    <TableHead>{t('emailAutomation.colStatus', 'Status')}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{template.template_key}</code>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{template.subject_en}</TableCell>
                      <TableCell>
                        <Badge variant={template.active ? 'default' : 'secondary'}>
                          {template.active ? t('emailAutomation.statusActive', 'Active') : t('emailAutomation.statusInactive', 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                            className="text-electric-blue border-electric-blue hover:bg-electric-blue hover:text-deep-purple"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('emailAutomation.testDialogTitle', 'Send Test Email')}</DialogTitle>
            <DialogDescription>{t('emailAutomation.testDialogDesc', 'Choose a template to send a test email to your admin email address')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('emailAutomation.selectTemplate', 'Select Template')}</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t('emailAutomation.selectTemplatePlaceholder', 'Choose a template...')} />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.active).map((template) => (
                    <SelectItem key={template.template_key} value={template.template_key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={sendTestEmail} disabled={!selectedTemplate}>
                <Send className="mr-2 h-4 w-4" />
                {t('emailAutomation.sendTest', 'Send Test')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Edit/Create Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-deep-purple border-white/20 text-white" key={editingTemplate?.id || 'new'}>
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTemplate ? 'Edit Email Template' : 'Create New Email Template'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editingTemplate 
                ? 'Update the email template content and settings'
                : 'Create a new email template for automated emails'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_key" className="text-white">Template Key *</Label>
                <Input
                  id="template_key"
                  value={templateForm.template_key}
                  onChange={(e) => setTemplateForm({ ...templateForm, template_key: e.target.value })}
                  placeholder="e.g., member_welcome"
                  disabled={!!editingTemplate}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <p className="text-xs text-white/60">Unique identifier (cannot be changed after creation)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Template Name *</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., New Member Welcome"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            {/* Language Tabs */}
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-black/40">
                <TabsTrigger value="en" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple">English</TabsTrigger>
                <TabsTrigger value="es" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple">Spanish</TabsTrigger>
                <TabsTrigger value="ca" className="data-[state=active]:bg-electric-blue data-[state=active]:text-deep-purple">Catalan</TabsTrigger>
              </TabsList>

              {/* English */}
              <TabsContent value="en" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_en" className="text-white">Subject (English) *</Label>
                  <Input
                    id="subject_en"
                    value={templateForm.subject_en}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject_en: e.target.value })}
                    placeholder="Email subject line"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_en" className="text-white">Body (English) *</Label>
                  <Textarea
                    id="body_en"
                    value={templateForm.body_en}
                    onChange={(e) => setTemplateForm({ ...templateForm, body_en: e.target.value })}
                    placeholder="Email body content. Use {{variable_name}} for placeholders."
                    rows={10}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono text-sm"
                  />
                  <p className="text-xs text-white/60">
                    Available variables: {'{{first_name}}'}, {'{{last_name}}'}, {'{{membership_type}}'}, {'{{end_date}}'}, {'{{amount}}'}, etc.
                  </p>
                </div>
              </TabsContent>

              {/* Spanish */}
              <TabsContent value="es" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_es" className="text-white">Subject (Spanish)</Label>
                  <Input
                    id="subject_es"
                    value={templateForm.subject_es}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject_es: e.target.value })}
                    placeholder="Asunto del correo"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_es" className="text-white">Body (Spanish)</Label>
                  <Textarea
                    id="body_es"
                    value={templateForm.body_es}
                    onChange={(e) => setTemplateForm({ ...templateForm, body_es: e.target.value })}
                    placeholder="Contenido del correo. Usa {{variable_name}} para marcadores de posición."
                    rows={10}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono text-sm"
                  />
                </div>
              </TabsContent>

              {/* Catalan */}
              <TabsContent value="ca" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_ca" className="text-white">Subject (Catalan)</Label>
                  <Input
                    id="subject_ca"
                    value={templateForm.subject_ca}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject_ca: e.target.value })}
                    placeholder="Assumpte del correu"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_ca" className="text-white">Body (Catalan)</Label>
                  <Textarea
                    id="body_ca"
                    value={templateForm.body_ca}
                    onChange={(e) => setTemplateForm({ ...templateForm, body_ca: e.target.value })}
                    placeholder="Contingut del correu. Utilitza {{variable_name}} per a marcadors de posició."
                    rows={10}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 font-mono text-sm"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Active Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={templateForm.active}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, active: checked })}
              />
              <Label htmlFor="active" className="text-white">Template is active</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTemplate} 
                disabled={savingTemplate}
                className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
              >
                {savingTemplate ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

