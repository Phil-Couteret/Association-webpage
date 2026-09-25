import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Key, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentConfig {
  id: number;
  gateway: string;
  is_active: boolean;
  api_key_public: string | null;
  api_key_secret: string | null;
  webhook_secret: string | null;
  config_json: string | null;
  created_at: string;
  updated_at: string;
}

const PaymentConfigManager = () => {
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PaymentConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    gateway: 'stripe',
    is_active: false,
    api_key_public: '',
    api_key_secret: '',
    webhook_secret: '',
    config_json: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (editingConfig) {
      setFormData({
        gateway: editingConfig.gateway,
        is_active: editingConfig.is_active,
        api_key_public: editingConfig.api_key_public || '',
        api_key_secret: editingConfig.api_key_secret || '',
        webhook_secret: editingConfig.webhook_secret || '',
        config_json: editingConfig.config_json || '',
      });
    } else {
      setFormData({
        gateway: 'stripe',
        is_active: false,
        api_key_public: '',
        api_key_secret: '',
        webhook_secret: '',
        config_json: '',
      });
    }
  }, [editingConfig, isDialogOpen]);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment-config-list.php', {
        credentials: 'include',
      });

      const responseText = await response.text();

      if (!response.ok) {
        // Try to parse as JSON for error message
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parse error:', e, 'Response:', responseText);
        throw new Error('Invalid JSON response: ' + responseText.substring(0, 100));
      }

      if (data.success) {
        setConfigs(data.configs || []);
      } else {
        throw new Error(data.error || data.message || 'Failed to fetch payment configs');
      }
    } catch (error) {
      console.error('Error fetching payment configs:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load payment configurations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (config: PaymentConfig) => {
    setEditingConfig(config);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingConfig(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = editingConfig
        ? '/api/payment-config-update.php'
        : '/api/payment-config-create.php';

      // Prepare data - convert empty strings to null for optional fields
      const payload: any = {
        id: editingConfig?.id,
        gateway: formData.gateway,
        is_active: formData.is_active,
        api_key_public: formData.api_key_public || null,
        api_key_secret: formData.api_key_secret || null,
        webhook_secret: formData.webhook_secret || null,
        config_json: formData.config_json.trim() || null,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      // Check if response is OK and has content
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response:', responseText);
        throw new Error('Invalid JSON response from server: ' + responseText.substring(0, 100));
      }

      if (data.success) {
        toast({
          title: "Success",
          description: editingConfig ? "Payment configuration updated" : "Payment configuration created",
        });
        setIsDialogOpen(false);
        setEditingConfig(null);
        fetchConfigs();
      } else {
        throw new Error(data.error || 'Failed to save payment configuration');
      }
    } catch (error) {
      console.error('Error saving payment config:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save payment configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const maskSecret = (value: string | null): string => {
    if (!value) return '';
    if (value.length <= 12) return '••••••••';
    // Show first 8 chars and last 4 chars
    return value.substring(0, 8) + '••••••••' + value.substring(value.length - 4);
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
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Gateway Configuration
              </CardTitle>
              <CardDescription className="text-white/70">
                Configure Stripe and other payment gateways. Store API keys securely.
              </CardDescription>
            </div>
            <Button
              onClick={handleNew}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              <Key className="h-4 w-4 mr-2" />
              Add Gateway
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <Alert className="bg-black/40 border-white/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-white/80">
                No payment gateways configured. Click "Add Gateway" to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.id} className="bg-black/60 border-white/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {config.gateway}
                          </h3>
                          <Badge
                            variant={config.is_active ? "default" : "secondary"}
                            className={
                              config.is_active
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                            }
                          >
                            {config.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className="text-white/70 text-xs">Public Key</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="text"
                                value={config.api_key_public ? maskSecret(config.api_key_public) : 'Not set'}
                                readOnly
                                className="bg-black/40 border-white/10 text-white/80 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-white/70 text-xs">Secret Key</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type={showSecrets[`secret_${config.id}`] ? "text" : "password"}
                                value={config.api_key_secret ? maskSecret(config.api_key_secret) : 'Not set'}
                                readOnly
                                className="bg-black/40 border-white/10 text-white/80 text-xs"
                              />
                              {config.api_key_secret && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSecretVisibility(`secret_${config.id}`)}
                                  className="h-8 w-8 p-0 text-white/60 hover:text-white"
                                >
                                  {showSecrets[`secret_${config.id}`] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-white/70 text-xs">Webhook Secret</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type={showSecrets[`webhook_${config.id}`] ? "text" : "password"}
                                value={config.webhook_secret ? maskSecret(config.webhook_secret) : 'Not set'}
                                readOnly
                                className="bg-black/40 border-white/10 text-white/80 text-xs"
                              />
                              {config.webhook_secret && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSecretVisibility(`webhook_${config.id}`)}
                                  className="h-8 w-8 p-0 text-white/60 hover:text-white"
                                >
                                  {showSecrets[`webhook_${config.id}`] ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-white/70 text-xs">Last Updated</Label>
                            <p className="text-white/60 text-xs mt-1">
                              {new Date(config.updated_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          onClick={() => handleEdit(config)}
                          variant="outline"
                          className="border-electric-blue text-electric-blue hover:bg-electric-blue/20"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-deep-purple text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingConfig ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {editingConfig
                ? 'Update payment gateway configuration. Leave fields empty to keep existing values.'
                : 'Configure a new payment gateway. Enter your API keys from Stripe dashboard.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="gateway" className="text-white">Gateway</Label>
              <Input
                id="gateway"
                value={formData.gateway}
                onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder="stripe"
                disabled={!!editingConfig}
              />
              <p className="text-white/60 text-xs mt-1">
                Payment gateway: stripe, paycomet, paypal
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active" className="text-white">Active</Label>
                <p className="text-white/60 text-xs mt-1">
                  Enable this payment gateway for use
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div>
              <Label htmlFor="api_key_public" className="text-white">Public API Key</Label>
              <Input
                id="api_key_public"
                type="text"
                value={formData.api_key_public}
                onChange={(e) => setFormData({ ...formData, api_key_public: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder={formData.gateway === 'paycomet' ? 'JET ID (optional)' : 'pk_test_...'}
              />
              <p className="text-white/60 text-xs mt-1">
                {formData.gateway === 'paycomet'
                  ? 'Paycomet JET ID for tokenization (optional). Leave empty if not using JET.'
                  : 'Stripe publishable key (starts with pk_test_ or pk_live_)'}
              </p>
            </div>

            <div>
              <Label htmlFor="api_key_secret" className="text-white">Secret API Key</Label>
              <Input
                id="api_key_secret"
                type="password"
                value={formData.api_key_secret}
                onChange={(e) => setFormData({ ...formData, api_key_secret: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder={formData.gateway === 'paycomet' ? 'API password' : 'sk_test_...'}
              />
              <p className="text-white/60 text-xs mt-1">
                {formData.gateway === 'paycomet'
                  ? 'Paycomet API password. Keep this secure!'
                  : 'Stripe secret key (starts with sk_test_ or sk_live_). Keep this secure!'}
              </p>
            </div>

            <div>
              <Label htmlFor="webhook_secret" className="text-white">Webhook Secret</Label>
              <Input
                id="webhook_secret"
                type="password"
                value={formData.webhook_secret}
                onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                className="bg-black/40 border-white/10 text-white"
                placeholder={formData.gateway === 'paycomet' ? 'IPN secret (if used)' : 'whsec_...'}
              />
              <p className="text-white/60 text-xs mt-1">
                {formData.gateway === 'paycomet'
                  ? 'Paycomet IPN callback signing secret (if provided by Paycomet).'
                  : 'Stripe webhook signing secret (starts with whsec_). Used to verify webhook events.'}
              </p>
            </div>

            <div>
              <Label htmlFor="config_json" className="text-white">Additional Config (JSON)</Label>
              <textarea
                id="config_json"
                value={formData.config_json}
                onChange={(e) => setFormData({ ...formData, config_json: e.target.value })}
                className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-md p-3 text-white text-sm font-mono"
                placeholder={formData.gateway === 'paycomet' ? '{"merchant_code":"...","terminal_id":"..."}' : '{"currency": "EUR", "country": "ES"}'}
              />
              <p className="text-white/60 text-xs mt-1">
                {formData.gateway === 'paycomet'
                  ? 'Required for Paycomet: merchant_code, terminal_id. Optional: api_url for sandbox.'
                  : 'Optional: Additional gateway-specific configuration in JSON format'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-electric-blue hover:bg-electric-blue/80 text-deep-purple"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentConfigManager;

