import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Euro, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Payment {
  id: number;
  date: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  membership_type: string;
  membership_start?: string;
  membership_end?: string;
  type: string;
  description: string;
  created_at: string;
}

interface PaymentHistoryData {
  success: boolean;
  payments: Payment[];
  total_payments: number;
  total_amount: number;
  message: string;
}

const PaymentHistory = () => {
  const { t } = useLanguage();
  const [paymentData, setPaymentData] = useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/payment-history.php', {
        credentials: 'include'
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Payment history JSON parse error:', e, 'Response:', responseText);
        throw new Error('Invalid response from server');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch payment history');
      }

      setPaymentData(data);
    } catch (err) {
      console.error('Payment history error:', err);
      // Don't show error if it's just "no payment history" - that's expected
      if (err instanceof Error && err.message.includes('No payment history')) {
        setPaymentData({
          success: true,
          payments: [],
          total_payments: 0,
          total_amount: 0,
          message: 'No payment history available.'
        });
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load payment history');
      }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Unpaid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">{status}</Badge>;
    }
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

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-400">{error}</AlertDescription>
      </Alert>
    );
  }

  const hasPayments = paymentData && paymentData.payments.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-white">
                {paymentData?.total_payments || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-white flex items-center gap-1">
                <Euro className="h-5 w-5" />
                {formatCurrency(paymentData?.total_amount || 0)}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Status</p>
              <div className="mt-1">
                {hasPayments ? (
                  getStatusBadge(paymentData?.payments[0]?.status || 'unpaid')
                ) : (
                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">No Payments</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPayments ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70 text-lg mb-2">
                No Payment History Available
              </p>
              <p className="text-white/50 text-sm max-w-md mx-auto">
                {paymentData?.message || 'Payment history will be available once online payments are enabled.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentData.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">
                          {payment.description}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(payment.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {payment.membership_start && payment.membership_end && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-sm text-white/60">
                      <p>
                        Membership Period: {formatDate(payment.membership_start)} - {formatDate(payment.membership_end)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;

