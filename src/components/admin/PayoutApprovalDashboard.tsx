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
  CreditCard,
  Settings
} from 'lucide-react';

const PayoutApprovalDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [payoutTransactions, setPayoutTransactions] = useState<PayoutTransaction[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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

  const openDetailsDialog = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(request)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openApprovalDialog(request)}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              title="Review & Approve/Reject"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setApprovalForm({ status: 'approved', admin_notes: '' });
                                handleApprovalAction();
                              }}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              title="Quick Approve"
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
                              title="Quick Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Payout Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Request Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Companion:</span>
                    <span>{selectedRequest.companion?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedRequest.requested_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span>{selectedRequest.payout_method}</span>
                  </div>
                  {selectedRequest.bank_name && (
                    <>
                      <div className="flex justify-between">
                        <span>Bank:</span>
                        <span>{selectedRequest.bank_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Account:</span>
                        <span>{selectedRequest.account_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Holder:</span>
                        <span>{selectedRequest.account_holder_name}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Decision</Label>
                <Select
                  value={approvalForm.status}
                  onValueChange={(value) => setApprovalForm(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this decision..."
                  value={approvalForm.admin_notes}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApprovalAction} disabled={loading}>
                  {loading ? 'Processing...' : 'Submit Decision'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed View Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Payout Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">Request Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-600">Request ID:</span>
                        <span className="text-sm font-mono">{selectedRequest.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-600">Status:</span>
                        <div>{getStatusBadge(selectedRequest.status)}</div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-600">Requested Amount:</span>
                        <span className="text-sm font-bold">{formatCurrency(selectedRequest.requested_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-600">Available Earnings:</span>
                        <span className="text-sm">{formatCurrency(selectedRequest.available_earnings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-600">Created:</span>
                        <span className="text-sm">{new Date(selectedRequest.created_at).toLocaleString()}</span>
                      </div>
                      {selectedRequest.processed_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-600">Processed:</span>
                          <span className="text-sm">{new Date(selectedRequest.processed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-3">Talent Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-600">Name:</span>
                        <span className="text-sm">{selectedRequest.companion?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-600">Email:</span>
                        <span className="text-sm">{selectedRequest.companion?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-600">Companion ID:</span>
                        <span className="text-sm font-mono">{selectedRequest.companion_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Details */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">Payment Method Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-600">Method:</span>
                      <span className="text-sm font-medium">{selectedRequest.payout_method}</span>
                    </div>
                    {selectedRequest.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Bank:</span>
                        <span className="text-sm">{selectedRequest.bank_name}</span>
                      </div>
                    )}
                    {selectedRequest.account_number && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Account Number:</span>
                        <span className="text-sm font-mono">{selectedRequest.account_number}</span>
                      </div>
                    )}
                    {selectedRequest.account_holder_name && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Account Holder:</span>
                        <span className="text-sm">{selectedRequest.account_holder_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedRequest.admin_notes && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Admin Notes</h4>
                  <p className="text-sm text-yellow-700">{selectedRequest.admin_notes}</p>
                </div>
              )}

              {/* Processing Information */}
              {selectedRequest.processed_by && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Processing Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Processed By:</span>
                      <span className="text-sm">{selectedRequest.processed_by}</span>
                    </div>
                    {selectedRequest.processed_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processed At:</span>
                        <span className="text-sm">{new Date(selectedRequest.processed_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                {selectedRequest.status === 'pending' && (
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openApprovalDialog(selectedRequest);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Review & Process
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutApprovalDashboard;
