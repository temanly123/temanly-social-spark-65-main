
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { TrendingUp, DollarSign, Download, Search, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PaymentStatus = Database['public']['Enums']['payment_status'];

interface Transaction {
  id: string;
  user_id: string;
  companion_id: string;
  service: string;
  amount: number;
  platform_fee: number;
  companion_earnings: number;
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
  user_name?: string;
  companion_name?: string;
}

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | PaymentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30days');
  const { toast } = useToast();

  // Revenue statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFees: 0,
    companionEarnings: 0,
    pendingPayments: 0,
    monthlyGrowth: 0
  });

  useEffect(() => {
    fetchTransactions();
    calculateStats();
  }, [filter, dateRange]);

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          user_profile:profiles!user_id(name),
          companion_profile:profiles!companion_id(name)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter as PaymentStatus);
      }

      // Date filtering
      if (dateRange !== 'all') {
        const daysAgo = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const enrichedData = data?.map(transaction => ({
        ...transaction,
        user_name: transaction.user_profile?.name || 'Unknown User',
        companion_name: transaction.companion_profile?.name || 'Unknown Talent'
      })) || [];

      setTransactions(enrichedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, platform_fee, companion_earnings, status');

      if (error) throw error;

      const totalRevenue = data.reduce((sum, t) => sum + (t.amount || 0), 0);
      const platformFees = data.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
      const companionEarnings = data.reduce((sum, t) => sum + (t.companion_earnings || 0), 0);
      const pendingPayments = data
        .filter(t => t.status === 'pending_verification')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        totalRevenue,
        platformFees,
        companionEarnings,
        pendingPayments,
        monthlyGrowth: 0 // Real calculation would need historical data
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const exportTransactions = () => {
    if (transactions.length === 0) {
      toast({
        title: "No Data",
        description: "No transactions to export",
        variant: "destructive"
      });
      return;
    }

    const csvData = transactions.map(t => ({
      ID: t.id,
      User: t.user_name,
      Talent: t.companion_name,
      Service: t.service,
      Amount: t.amount,
      'Platform Fee': t.platform_fee,
      'Talent Earnings': t.companion_earnings,
      'Payment Method': t.payment_method,
      Status: t.status,
      Date: new Date(t.created_at).toLocaleDateString('id-ID')
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `temanly-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter(t =>
    t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.companion_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.platformFees.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              Platform earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Talent Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.companionEarnings.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              Paid to talents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">Rp {stats.pendingPayments.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Management</CardTitle>
            <Button onClick={exportTransactions} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search users, talents, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | PaymentStatus)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Table */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {transactions.length === 0 ? "No transactions found." : "No transactions match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Talent</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Talent Earnings</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{transaction.user_name}</TableCell>
                    <TableCell>{transaction.companion_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.service}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      Rp {(transaction.platform_fee || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-green-600">
                      Rp {(transaction.companion_earnings || 0).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{transaction.payment_method}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          transaction.status === 'paid' ? 'bg-green-100 text-green-600' :
                          transaction.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-600' :
                          transaction.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionManagement;
