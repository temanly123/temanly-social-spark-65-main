
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle, XCircle, User, Calendar, CreditCard, DollarSign } from 'lucide-react';

interface PaymentDetail {
  id: string;
  amount: number;
  service: string;
  payment_method: string;
  status: string;
  companion_earnings: number;
  platform_fee: number;
  created_at: string;
  user_id: string;
  companion_id: string;
  booking_id: string;
}

interface PaymentDetailModalProps {
  payment: PaymentDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (paymentId: string) => void;
  onReject: (paymentId: string) => void;
  loading?: boolean;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  payment,
  isOpen,
  onClose,
  onApprove,
  onReject,
  loading = false
}) => {
  if (!payment) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_verification':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleApprove = () => {
    onApprove(payment.id);
    onClose();
  };

  const handleReject = () => {
    onReject(payment.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Verification Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(payment.status)}
              <span className="font-medium">Current Status</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {payment.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Transaction Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Transaction ID</h4>
              <p className="font-mono text-sm">{payment.id.slice(0, 16)}...</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Service</h4>
              <Badge variant="secondary">{payment.service}</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Payment Method</h4>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="capitalize">{payment.payment_method}</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-gray-600">Transaction Date</h4>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(payment.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <div className="space-y-4">
            <h4 className="font-semibold">Financial Breakdown</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-700">Total Amount</h5>
                <p className="text-xl font-bold text-blue-800">
                  Rp {payment.amount.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="text-sm font-medium text-green-700">Talent Earnings</h5>
                <p className="text-xl font-bold text-green-800">
                  Rp {(payment.companion_earnings || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="text-sm font-medium text-purple-700">Platform Fee</h5>
                <p className="text-xl font-bold text-purple-800">
                  Rp {(payment.platform_fee || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Information */}
          <div className="space-y-3">
            <h4 className="font-semibold">Related Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>User ID: {payment.user_id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Talent ID: {payment.companion_id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Booking ID: {payment.booking_id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Verification Warning */}
          {payment.status === 'pending_verification' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <h5 className="font-medium text-yellow-800">Verification Required</h5>
                  <p className="text-yellow-700 mt-1">
                    Pastikan untuk memverifikasi semua detail pembayaran sebelum menyetujui transaksi ini. 
                    Setelah disetujui, pembayaran akan diproses dan tidak dapat dibatalkan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {payment.status === 'pending_verification' && (
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject Payment
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Payment
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailModal;
