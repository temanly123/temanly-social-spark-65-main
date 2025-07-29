import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, CreditCard, TrendingUp, TrendingDown, Plus, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ENV } from '@/config/env';


// Declare global Snap for Midtrans
declare global {
  interface Window {
    snap: any;
  }
}

interface Transaction {
  id: string;
  amount: number;
  type: 'payment' | 'topup' | 'refund';
  status: string;
  service: string;
  created_at: string;
  description?: string;
}

const UserWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);


  useEffect(() => {
    if (user && user.id) {
      fetchWalletData();
    }
  }, [user?.id]); // Only re-run when user ID changes, not the entire user object

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      // Fetch transactions
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedTransactions = transactionData?.map(tx => ({
        id: tx.id,
        amount: tx.amount || 0,
        type: tx.amount > 0 ? 'topup' : 'payment' as 'payment' | 'topup' | 'refund',
        status: tx.status || 'completed',
        service: tx.service || 'Unknown',
        created_at: tx.created_at,
        description: tx.service
      })) || [];

      setTransactions(formattedTransactions);

      // Calculate balance from actual transactions
      const totalTopups = formattedTransactions
        .filter(tx => tx.type === 'topup')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalSpent = formattedTransactions
        .filter(tx => tx.type === 'payment')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      setBalance(totalTopups - totalSpent); // Real balance calculation

    } catch (error: any) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data wallet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!user || !topUpAmount) return;

    const amount = parseInt(topUpAmount);
    if (amount < 10000) {
      toast({
        title: "Minimum Top Up",
        description: "Minimum top up adalah Rp 10.000",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingTopUp(true);

    try {
      // Generate unique order ID for top up
      const orderId = `TOPUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create top up transaction using Midtrans
      const response = await fetch(`${ENV.SUPABASE_URL}/functions/v1/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          booking_data: {
            service: 'Wallet Top Up',
            user_id: user.id,
            total: amount,
            booking_id: orderId,
            duration: 1
          },
          amount: amount,
          order_id: orderId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const paymentData = await response.json();

      // Load Midtrans Snap if not already loaded
      if (typeof window.snap === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://app.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', ENV.MIDTRANS_CLIENT_KEY || 'Mid-client-t14R0G6XRLw9MLZj');
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Open Midtrans payment popup
      window.snap.pay(paymentData.token, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          toast({
            title: "Top Up Berhasil!",
            description: `Saldo Anda telah bertambah Rp ${amount.toLocaleString('id-ID')}`,
          });
          setIsTopUpOpen(false);
          setTopUpAmount('');
          fetchWalletData(); // Refresh wallet data
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          toast({
            title: "Pembayaran Pending",
            description: "Pembayaran Anda sedang diproses",
            variant: "default"
          });
        },
        onError: function(result: any) {
          console.log('Payment error:', result);
          toast({
            title: "Pembayaran Gagal",
            description: "Terjadi kesalahan saat memproses pembayaran",
            variant: "destructive"
          });
        },
        onClose: function() {
          console.log('Payment popup closed');
        }
      });

    } catch (error: any) {
      console.error('Top up error:', error);
      toast({
        title: "Error",
        description: "Gagal memproses top up. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'refund':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default:
        return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Berhasil</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Gagal</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'topup':
        return 'Top Up';
      case 'payment':
        return 'Pembayaran';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data wallet...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="w-5 h-5" />
            Saldo Temanly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-4">
            Rp {balance.toLocaleString()}
          </div>
          <div className="flex gap-3">
            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Top Up
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Top Up Saldo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Jumlah Top Up</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Minimum Rp 10.000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      min="10000"
                      step="1000"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[50000, 100000, 200000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setTopUpAmount(amount.toString())}
                      >
                        Rp {amount.toLocaleString('id-ID')}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[500000, 1000000, 2000000].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setTopUpAmount(amount.toString())}
                      >
                        Rp {amount.toLocaleString('id-ID')}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={handleTopUp}
                    disabled={!topUpAmount || isProcessingTopUp}
                    className="w-full"
                  >
                    {isProcessingTopUp ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada transaksi</p>
              <p className="text-sm text-gray-500">Transaksi Anda akan muncul di sini</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{transaction.description || transaction.service}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        {formatTransactionType(transaction.type)}
                      </div>
                    </TableCell>
                    <TableCell className={transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.type === 'payment' ? '-' : '+'}Rp {Math.abs(transaction.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Metode Pembayaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="font-medium text-gray-800">Saat top up, Anda dapat memilih dari berbagai metode pembayaran:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Kartu Kredit/Debit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Transfer Bank (BCA, BNI, BRI, dll)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>E-Wallet (GoPay, OVO, DANA)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>QRIS & Convenience Store</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Metode pembayaran dipilih langsung saat proses top up melalui sistem pembayaran yang aman.
            </p>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default UserWallet;