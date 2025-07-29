import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';

interface PaymentNotification {
  id: string;
  amount: number;
  service: string;
  status: string;
  payment_method: string;
  created_at: string;
  user_name?: string;
  companion_name?: string;
  isNew?: boolean;
}

const PaymentMonitor: React.FC = () => {
  const [recentPayments, setRecentPayments] = useState<PaymentNotification[]>([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCount: 0,
    pendingCount: 0,
    successRate: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentPayments();
    calculateStats();
    setupRealTimeMonitoring();
  }, []);

  const fetchRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          service,
          status,
          payment_method,
          created_at,
          profiles_user:profiles!user_id(name),
          profiles_companion:profiles!companion_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedPayments = data?.map(payment => ({
        ...payment,
        user_name: payment.profiles_user?.name,
        companion_name: payment.profiles_companion?.name
      })) || [];

      setRecentPayments(formattedPayments);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const calculateStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's transactions
      const { data: todayData, error: todayError } = await supabase
        .from('transactions')
        .select('amount, status')
        .gte('created_at', today.toISOString());

      if (todayError) throw todayError;

      const todayTotal = todayData?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const todayCount = todayData?.length || 0;
      const pendingCount = todayData?.filter(t => t.status === 'pending').length || 0;
      const successCount = todayData?.filter(t => t.status === 'paid').length || 0;
      const successRate = todayCount > 0 ? (successCount / todayCount) * 100 : 0;

      setStats({
        todayTotal,
        todayCount,
        pendingCount,
        successRate
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const setupRealTimeMonitoring = () => {
    console.log('🔄 [PaymentMonitor] Setting up real-time monitoring...');
    
    const channel = supabase
      .channel('payment-monitor')
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'transactions' 
        },
        (payload) => {
          console.log('💰 [PaymentMonitor] New payment received:', payload.new);
          handleNewPayment(payload.new);
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'transactions' 
        },
        (payload) => {
          console.log('🔄 [PaymentMonitor] Payment updated:', payload.new);
          handlePaymentUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 [PaymentMonitor] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🔌 [PaymentMonitor] Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  };

  const handleNewPayment = async (newPayment: any) => {
    // Fetch complete payment data with user info
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        service,
        status,
        payment_method,
        created_at,
        profiles_user:profiles!user_id(name),
        profiles_companion:profiles!companion_id(name)
      `)
      .eq('id', newPayment.id)
      .single();

    if (error) {
      console.error('Error fetching new payment details:', error);
      return;
    }

    const formattedPayment = {
      ...data,
      user_name: data.profiles_user?.name,
      companion_name: data.profiles_companion?.name,
      isNew: true
    };

    // Add to recent payments
    setRecentPayments(prev => [formattedPayment, ...prev.slice(0, 9)]);

    // Show notification
    toast({
      title: "💰 New Payment Received",
      description: `${formattedPayment.service} - Rp ${formattedPayment.amount.toLocaleString('id-ID')}`,
      className: "bg-green-50 border-green-200"
    });

    // Update stats
    calculateStats();

    // Remove "new" flag after 5 seconds
    setTimeout(() => {
      setRecentPayments(prev => 
        prev.map(p => p.id === formattedPayment.id ? { ...p, isNew: false } : p)
      );
    }, 5000);
  };

  const handlePaymentUpdate = async (updatedPayment: any) => {
    // Update the payment in the list
    setRecentPayments(prev => 
      prev.map(p => 
        p.id === updatedPayment.id 
          ? { ...p, status: updatedPayment.status }
          : p
      )
    );

    // Show notification for status changes
    if (updatedPayment.status === 'paid') {
      toast({
        title: "✅ Payment Confirmed",
        description: `Payment ${updatedPayment.id.slice(0, 8)}... has been confirmed`,
        className: "bg-green-50 border-green-200"
      });
    } else if (updatedPayment.status === 'failed') {
      toast({
        title: "❌ Payment Failed",
        description: `Payment ${updatedPayment.id.slice(0, 8)}... has failed`,
        variant: "destructive"
      });
    }

    // Update stats
    calculateStats();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Payment Monitor
            <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {stats.todayTotal.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Today's success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Monitoring</CardTitle>
            <Bell className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                fetchRecentPayments();
                calculateStats();
              }}
              className="w-full"
            >
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent payments found
              </div>
            ) : (
              recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    payment.isNew ? 'bg-blue-50 border-blue-200 animate-pulse' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="font-medium">{payment.service}</p>
                      <p className="text-sm text-gray-600">
                        {payment.user_name} → {payment.companion_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      Rp {payment.amount.toLocaleString('id-ID')}
                    </p>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMonitor;
