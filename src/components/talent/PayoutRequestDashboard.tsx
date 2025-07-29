import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '@/services/paymentService';
import { 
  PayoutRequest, 
  CompanionEarningsSummary,
  PayoutRequestForm,
  PaymentTransaction 
} from '@/types/payment';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Eye,
  RefreshCw,
  CreditCard,
  Wallet
} from 'lucide-react';

interface PayoutRequestDashboardProps {
  companionId: string; // In real app, this would come from auth context
}

const PayoutRequestDashboard: React.FC<PayoutRequestDashboardProps> = ({ companionId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState<CompanionEarningsSummary | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  
  // Form state
  const [requestForm, setRequestForm] = useState<PayoutRequestForm>({
    requested_amount: 0,
    payout_method: 'bank_transfer',
    bank_name: '',
    account_number: '',
    account_holder_name: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, [companionId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [earningsData, payoutsData, transactionsData] = await Promise.all([
        PaymentService.getCompanionEarnings(companionId),
        PaymentService.getPayoutRequests({ companion_id: companionId }),
        PaymentService.getPaymentTransactions({ companion_id: companionId, limit: 20 })
      ]);

      setEarnings(earningsData);
      setPayoutRequests(payoutsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayoutRequest = async () => {
    if (!earnings) return;

    if (requestForm.requested_amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (requestForm.requested_amount > earnings.available_earnings) {
      toast({
        title: "Insufficient Funds",
        description: "Requested amount exceeds available earnings",
        variant: "destructive"
      });
      return;
    }

    if (requestForm.payout_method === 'bank_transfer' && 
        (!requestForm.bank_name || !requestForm.account_number || !requestForm.account_holder_name)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all bank details",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await PaymentService.createPayoutRequest({
        ...requestForm,
        companion_id: companionId
      });

      toast({
        title: "Success",
        description: "Payout request created successfully",
        className: "bg-green-50 border-green-200"
      });

      setShowRequestDialog(false);
      setRequestForm({
        requested_amount: 0,
        payout_method: 'bank_transfer',
        bank_name: '',
        account_number: '',
        account_holder_name: ''
      });
      
      loadDashboardData();
    } catch (error) {
      console.error('Error creating payout request:', error);
      toast({
        title: "Error",
        description: "Failed to create payout request",
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
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
      processed: { color: 'bg-green-100 text-green-800', label: 'Processed', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed', icon: XCircle }
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

  const canRequestPayout = earnings && earnings.available_earnings > 0 && 
    !payoutRequests.some(req => req.status === 'pending' || req.status === 'approved');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Dashboard</h1>
          <p className="text-gray-600">Manage your earnings and payout requests</p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Earnings Overview */}
      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(earnings.total_earnings)}
                  </p>
                  <p className="text-xs text-gray-500">{earnings.total_transactions} transactions</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available for Payout</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(earnings.available_earnings)}
                  </p>
                  <p className="text-xs text-gray-500">Ready to withdraw</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(earnings.total_paid_out)}
                  </p>
                  <p className="text-xs text-gray-500">{earnings.total_payout_requests} requests</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payout Request Button */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Request Payout</h3>
              <p className="text-gray-600">
                {canRequestPayout 
                  ? "You can request a payout for your available earnings"
                  : "No available earnings or pending request exists"
                }
              </p>
            </div>
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button disabled={!canRequestPayout}>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Payout Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={requestForm.requested_amount || ''}
                      onChange={(e) => setRequestForm(prev => ({
                        ...prev,
                        requested_amount: parseFloat(e.target.value) || 0
                      }))}
                      max={earnings?.available_earnings || 0}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {earnings ? formatCurrency(earnings.available_earnings) : 'Loading...'}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="method">Payout Method</Label>
                    <Select 
                      value={requestForm.payout_method} 
                      onValueChange={(value) => setRequestForm(prev => ({ ...prev, payout_method: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="e_wallet">E-Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {requestForm.payout_method === 'bank_transfer' && (
                    <>
                      <div>
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          placeholder="e.g., BCA, Mandiri, BNI"
                          value={requestForm.bank_name}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, bank_name: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="account_number">Account Number</Label>
                        <Input
                          id="account_number"
                          placeholder="Enter account number"
                          value={requestForm.account_number}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, account_number: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="account_holder">Account Holder Name</Label>
                        <Input
                          id="account_holder"
                          placeholder="Enter account holder name"
                          value={requestForm.account_holder_name}
                          onChange={(e) => setRequestForm(prev => ({ ...prev, account_holder_name: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePayoutRequest} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Request'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Payout Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payout requests yet</p>
              <p className="text-sm text-gray-400">Create your first payout request to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payoutRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(request.requested_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.payout_method}</div>
                        {request.bank_name && (
                          <div className="text-sm text-gray-500">{request.bank_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.admin_notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutRequestDashboard;
