import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  User, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Hash,
  Receipt
} from 'lucide-react';

interface MidtransPaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

const MidtransPaymentDetailModal: React.FC<MidtransPaymentDetailModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!transaction) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'settlement':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'deny':
      case 'cancel':
      case 'expire':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'settlement':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'deny':
      case 'cancel':
      case 'expire':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const midtransResponse = transaction.midtrans_response || {};
  const midtransData = transaction.midtrans_data || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details - {transaction.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Transaction Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${getStatusColor(transaction.status)} flex items-center gap-1`}>
                    {getStatusIcon(transaction.status)}
                    {transaction.status?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatCurrency(transaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{transaction.service}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{midtransResponse.payment_type || transaction.payment_method}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(transaction.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="font-medium">{formatDateTime(transaction.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Settlement Time</p>
                  <p className="font-medium">{formatDateTime(transaction.settlement_time || midtransResponse.settlement_time)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {transaction.profiles_user?.name || 'Unknown Customer'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.profiles_user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Talent</p>
                  <p className="font-medium">
                    {transaction.profiles_companion?.name || 'Unknown Talent'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.profiles_companion?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Platform Fee (10%)</span>
                  <span>{formatCurrency(transaction.platform_fee || transaction.amount * 0.1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Talent Earnings (90%)</span>
                  <span>{formatCurrency(transaction.companion_earnings || transaction.amount * 0.9)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Midtrans Details */}
          {midtransResponse && Object.keys(midtransResponse).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Midtrans Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Transaction Status</p>
                    <p className="font-medium">{midtransResponse.transaction_status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fraud Status</p>
                    <p className="font-medium">{midtransResponse.fraud_status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Type</p>
                    <p className="font-medium">{midtransResponse.payment_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status Code</p>
                    <p className="font-medium">{midtransResponse.status_code}</p>
                  </div>
                  {midtransResponse.bank && (
                    <div>
                      <p className="text-muted-foreground">Bank</p>
                      <p className="font-medium">{midtransResponse.bank}</p>
                    </div>
                  )}
                  {midtransResponse.va_number && (
                    <div>
                      <p className="text-muted-foreground">VA Number</p>
                      <p className="font-medium">{midtransResponse.va_number}</p>
                    </div>
                  )}
                  {midtransResponse.transaction_time && (
                    <div>
                      <p className="text-muted-foreground">Transaction Time</p>
                      <p className="font-medium">{formatDateTime(midtransResponse.transaction_time)}</p>
                    </div>
                  )}
                  {midtransResponse.settlement_time && (
                    <div>
                      <p className="text-muted-foreground">Settlement Time</p>
                      <p className="font-medium">{formatDateTime(midtransResponse.settlement_time)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Information */}
          {transaction.bookings && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-medium">{transaction.booking_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Service Date</p>
                    <p className="font-medium">{transaction.bookings.service_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Service Time</p>
                    <p className="font-medium">{transaction.bookings.service_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{transaction.bookings.location || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MidtransPaymentDetailModal;
