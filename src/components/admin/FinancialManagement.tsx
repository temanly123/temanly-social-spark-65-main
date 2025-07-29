import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '@/services/paymentService';
import {
  PaymentTransaction,
  PayoutRequest,
  PaymentAnalytics,
  CompanionEarningsSummary
} from '@/types/payment';

import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  User,
  Eye,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

// Import existing components
import PayoutApprovalDashboard from './PayoutApprovalDashboard';
import FinancialOverview from './FinancialOverview';

interface FinancialManagementProps {
  onNavigateToTab?: (tabValue: string) => void;
}

const FinancialManagement: React.FC<FinancialManagementProps> = ({ onNavigateToTab }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [companionEarnings, setCompanionEarnings] = useState<CompanionEarningsSummary[]>([]);

  // Filters
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Function to handle navigation to User Management
  const handleNavigateToUserManagement = (talentId?: string) => {
    if (onNavigateToTab) {
      onNavigateToTab('all-users');
    } else {
      // Fallback: try to trigger tab change via DOM manipulation
      const allUsersTab = document.querySelector('[value="all-users"]') as HTMLElement;
      if (allUsersTab) {
        allUsersTab.click();
      }
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [analyticsData, transactionsData, payoutsData, earningsData] = await Promise.all([
        PaymentService.getPaymentAnalytics(),
        PaymentService.getPaymentTransactions({ limit: 100 }),
        PaymentService.getPayoutRequests({ limit: 100 }),
        PaymentService.getAllCompanionEarnings()
      ]);

      setAnalytics(analyticsData);
      setTransactions(transactionsData);
      setPayoutRequests(payoutsData);
      setCompanionEarnings(earningsData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: XCircle },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      processed: { color: 'bg-green-100 text-green-800', label: 'Processed', icon: CheckCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = transactionFilter === 'all' || transaction.status === transactionFilter;
    const matchesSearch = searchTerm === '' || 
      transaction.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.midtrans_order_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Use analytics data for summary stats
  const totalRevenue = analytics?.total_revenue || 0;
  const platformFees = analytics?.total_platform_fees || 0;
  const companionEarningsTotal = analytics?.total_companion_earnings || 0;
  const commissionRevenue = analytics?.total_commission_revenue || (totalRevenue - platformFees - companionEarningsTotal);
  const totalPlatformRevenue = analytics?.total_platform_revenue || (platformFees + commissionRevenue);
  const pendingPayouts = analytics?.pending_payouts || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Complete financial overview, payments, and payouts</p>
        </div>
        <Button onClick={loadFinancialData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>



      {/* Earnings Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Temanly Revenue Model Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Total Revenue</h4>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-blue-700">All customer payments</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">App Fees (10%)</h4>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(platformFees)}</p>
              <p className="text-sm text-green-700">Platform service fee</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Commission Revenue</h4>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(commissionRevenue)}</p>
              <p className="text-sm text-orange-700">15-20% from talent earnings</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Talent Earnings</h4>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(companionEarningsTotal)}</p>
              <p className="text-sm text-purple-700">After all deductions</p>
            </div>
          </div>

          {/* Platform Revenue Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-semibold text-gray-800">Total Platform Revenue</h5>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalPlatformRevenue)}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>App Fees (10%):</span>
                <span>{formatCurrency(platformFees)}</span>
              </div>
              <div className="flex justify-between">
                <span>Commission Revenue:</span>
                <span>{formatCurrency(commissionRevenue)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total Platform Earnings:</span>
                <span>{formatCurrency(totalPlatformRevenue)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-2">Temanly Business Model:</h5>
            <div className="text-sm text-gray-600 space-y-2">
              <div><strong>1. Customer Payment:</strong> Service Amount + 10% App Fee</div>
              <div><strong>2. Platform Revenue:</strong> 10% App Fee + Commission from Service Amount</div>
              <div><strong>3. Commission Rates by Talent Level:</strong></div>
              <div className="ml-4 space-y-1">
                <div>• Fresh Talent: 20% commission</div>
                <div>• Elite Talent: 18% commission (30+ orders, 4.5+ rating)</div>
                <div>• VIP Talent: 15% commission (100+ orders, 4.5+ rating, 6+ months)</div>
              </div>
              <div><strong>4. Talent Earnings:</strong> Service Amount - Commission</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-500">All transactions</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlatformRevenue)}</p>
                <p className="text-xs text-gray-500">Fees + Commissions</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Companion Earnings</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(companionEarningsTotal)}</p>
                <p className="text-xs text-gray-500">Total paid out</p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingPayouts}</p>
                <p className="text-xs text-gray-500">Awaiting approval</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="transactions">Payment Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payout Management</TabsTrigger>
          <TabsTrigger value="earnings">Companion Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <FinancialOverview />

            {/* Service Pricing Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Temanly Service Pricing Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-800">Chat Service</h4>
                    <p className="text-lg font-bold text-green-600">Rp 25,000/day</p>
                    <p className="text-sm text-gray-600">+ 10% app fee</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-800">Phone Call</h4>
                    <p className="text-lg font-bold text-green-600">Rp 40,000/hour</p>
                    <p className="text-sm text-gray-600">+ 10% app fee</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-800">Video Call</h4>
                    <p className="text-lg font-bold text-green-600">Rp 65,000/hour</p>
                    <p className="text-sm text-gray-600">+ 10% app fee</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-800">Rent a Lover</h4>
                    <p className="text-lg font-bold text-green-600">Up to Rp 85,000/day</p>
                    <p className="text-sm text-gray-600">+ 10% app fee</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-800">Offline Date</h4>
                    <p className="text-lg font-bold text-green-600">Rp 285,000/3 hours</p>
                    <p className="text-sm text-gray-600">+ transport + 10% app fee</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-800">Party Buddy</h4>
                    <p className="text-lg font-bold text-green-600">Rp 1,000,000/event</p>
                    <p className="text-sm text-gray-600">8 hours + 10% app fee</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Payment Transactions</CardTitle>
                <div className="flex gap-2">
                  <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.midtrans_order_id || transaction.id.slice(0, 8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {transaction.payment_method}
                            </div>
                            <div className="text-xs mt-1 flex items-center gap-1">
                              <span className="text-gray-600">Talent:</span>
                              <button
                                onClick={() => handleNavigateToUserManagement(transaction.companion_id)}
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                                title="View talent in User Management"
                              >
                                {transaction.companion_name || 'Unknown'}
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.service_name}</div>
                          <div className="text-sm text-gray-500">{transaction.duration}h</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>App Fee: {formatCurrency(transaction.platform_fee || 0)}</div>
                            <div>Talent: {formatCurrency(transaction.companion_earnings || 0)}</div>
                            <div>Commission: {transaction.commission_rate}%</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutApprovalDashboard />
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Companion Earnings Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Companion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Earnings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Withdrawn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Payout
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {companionEarnings.map((earning) => (
                      <tr key={earning.companion_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {earning.companion_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {earning.companion_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            earning.talent_level === 'VIP' ? 'bg-purple-100 text-purple-800' :
                            earning.talent_level === 'Elite' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {earning.talent_level} {earning.talent_level === 'VIP' ? '(15%)' : earning.talent_level === 'Elite' ? '(18%)' : '(20%)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(earning.total_earnings)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(earning.available_balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(earning.total_withdrawn)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {earning.last_payout_date ? 
                              new Date(earning.last_payout_date).toLocaleDateString() : 
                              'Never'
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Transaction Details - {selectedTransaction.midtrans_order_id || selectedTransaction.id.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Transaction ID</label>
                    <p className="font-mono text-sm">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Midtrans Order ID</label>
                    <p className="font-mono text-sm">{selectedTransaction.midtrans_order_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Service</label>
                    <p className="text-sm">{selectedTransaction.service_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-sm">{selectedTransaction.duration} hour(s)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTransaction.status || selectedTransaction.payment_status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm">{selectedTransaction.payment_method}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created Date</label>
                    <p className="text-sm">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                  </div>
                  {selectedTransaction.paid_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Paid Date</label>
                      <p className="text-sm">{new Date(selectedTransaction.paid_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User and Talent Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Customer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-blue-600">Name</label>
                      <p className="text-sm">{selectedTransaction.user_name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-blue-600">Email</label>
                      <p className="text-sm">{selectedTransaction.user_email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-blue-600">User ID</label>
                      <p className="text-xs font-mono">{selectedTransaction.user_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Talent Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-purple-600">Name</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleNavigateToUserManagement(selectedTransaction.companion_id)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
                          title="View talent in User Management"
                        >
                          {selectedTransaction.companion_name || 'N/A'}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-600">Email</label>
                      <p className="text-sm">{selectedTransaction.companion_email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-600">Level</label>
                      <p className="text-sm">
                        <Badge variant="outline" className="text-xs">
                          {selectedTransaction.companion_level || 'N/A'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-600">Talent ID</label>
                      <p className="text-xs font-mono">{selectedTransaction.companion_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">Financial Breakdown</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-green-600">Total Amount</label>
                    <p className="text-lg font-bold text-green-800">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-600">Platform Fee (10%)</label>
                    <p className="text-lg font-bold text-green-800">{formatCurrency(selectedTransaction.platform_fee)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-600">Talent Earnings</label>
                    <p className="text-lg font-bold text-green-800">{formatCurrency(selectedTransaction.companion_earnings)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-700">Commission Rate ({selectedTransaction.companion_level}):</span>
                    <span className="font-semibold text-green-800">{selectedTransaction.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-green-700">Commission Amount:</span>
                    <span className="font-semibold text-green-800">
                      {formatCurrency((selectedTransaction.amount - selectedTransaction.platform_fee) * (selectedTransaction.commission_rate / 100))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FinancialManagement;
