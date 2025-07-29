import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PaymentService } from '@/services/paymentService';
import { 
  PayoutRequest, 
  PayoutTransaction,
  PayoutApprovalForm 
} from '@/types/payment';
import { 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';

const PayoutApprovalDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [payoutTransactions, setPayoutTransactions] = useState<PayoutTransaction[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Approval form state
  const [approvalForm, setApprovalForm] = useState<PayoutApprovalForm>({
    status: 'approved',
    admin_notes: ''
  });

  useEffect(() => {
    loadPayoutData();
  }, []);

  const loadPayoutData = async () => {
    setLoading(true);
    try {
      console.log('Loading payout data...');

      // Check localStorage first for demo data
      const demoRequests = JSON.parse(localStorage.getItem('demo_payout_requests') || '[]');
      console.log('Demo requests in localStorage:', demoRequests);

      const [requestsData, transactionsData] = await Promise.all([
        PaymentService.getPayoutRequests({ limit: 100 }),
        PaymentService.getPayoutTransactions({ limit: 100 })
      ]);

      console.log('Loaded payout requests from service:', requestsData);
      console.log('Loaded payout transactions:', transactionsData);

      // Combine service data with localStorage demo data
      const allRequests = [...requestsData, ...demoRequests];
      console.log('Combined payout requests:', allRequests);

      setPayoutRequests(allRequests);
      setPayoutTransactions(transactionsData);

    } catch (error) {
      console.error('Error loading payout data:', error);
      toast({
        title: "Error",
        description: "Failed to load payout data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    try {
      await PaymentService.updatePayoutRequest(selectedRequest.id, {
        ...approvalForm,
        processed_by: 'admin-user-id' // In real app, this would come from auth context
      });

      toast({
        title: "Success",
        description: `Payout request ${approvalForm.status} successfully`,
        className: "bg-green-50 border-green-200"
      });

      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setApprovalForm({ status: 'approved', admin_notes: '' });
      
      loadPayoutData();
    } catch (error) {
      console.error('Error processing payout request:', error);
      toast({
        title: "Error",
        description: "Failed to process payout request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openApprovalDialog = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setApprovalForm({ status: 'approved', admin_notes: '' });
    setShowApprovalDialog(true);
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

  const filteredRequests = payoutRequests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const pendingRequests = payoutRequests.filter(req => req.status === 'pending');
  const approvedRequests = payoutRequests.filter(req => req.status === 'approved');
  const processedRequests = payoutRequests.filter(req => req.status === 'processed');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Approval</h1>
          <p className="text-gray-600">Review and approve companion payout requests</p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            Debug: Found {payoutRequests.length} payout requests | Filtered: {filteredRequests.length} (filter: {statusFilter})
            {payoutRequests.length > 0 && (
              <span> | Latest: {payoutRequests[0]?.id} - {payoutRequests[0]?.status}</span>
            )}
          </div>
        </div>
        <Button onClick={loadPayoutData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-xs text-gray-500">Needs attention</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{approvedRequests.length}</p>
                <p className="text-xs text-gray-500">Ready for processing</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{processedRequests.length}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    pendingRequests.reduce((sum, req) => sum + req.requested_amount, 0)
                  )}
                </p>
                <p className="text-xs text-gray-500">Pending payouts</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Payout Requests</h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payout Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Companion
                  </th>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.companion?.full_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.companion?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(request.requested_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Available: {formatCurrency(request.available_earnings)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.payout_method}</div>
                      {request.bank_name && (
                        <div className="text-sm text-gray-500">
                          {request.bank_name} - {request.account_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      {request.processed_at && (
                        <div className="text-sm text-gray-500">
                          Processed: {new Date(request.processed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openApprovalDialog(request)}
                        disabled={request.status !== 'pending'}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setApprovalForm({ status: 'approved', admin_notes: '' });
                              handleApprovalAction();
                            }}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setApprovalForm({ status: 'rejected', admin_notes: 'Rejected by admin' });
                              handleApprovalAction();
                            }}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutApprovalDashboard;
