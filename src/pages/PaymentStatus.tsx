
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, CreditCard, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);

  const status = searchParams.get('status') || 'pending';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '';
  const service = searchParams.get('service') || '';
  const talent = searchParams.get('talent') || '';
  const message = searchParams.get('message') || '';

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            navigate('/user-dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'Payment Successful! 🎉',
          subtitle: 'Your booking has been confirmed',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'pending':
        return {
          icon: <Clock className="w-16 h-16 text-yellow-500" />,
          title: 'Payment Pending ⏳',
          subtitle: 'Your payment is being processed',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'Payment Failed ❌',
          subtitle: 'There was an issue processing your payment',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default:
        return {
          icon: <CreditCard className="w-16 h-16 text-gray-500" />,
          title: 'Processing Payment',
          subtitle: 'Please wait...',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusConfig = getStatusConfig();

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return 'Your booking has been successfully confirmed. You will receive a confirmation email shortly.';
      case 'pending':
        return message || 'Your payment is being processed. You will receive a notification once completed. Please do not close this page.';
      case 'failed':
        return message || 'Your payment could not be processed. Please try again or contact our support team for assistance.';
      default:
        return 'Processing your payment request...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Payment Status" 
        subtitle="Your booking payment status"
        backTo="/user-dashboard"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-2`}>
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                {statusConfig.icon}
              </div>
              
              <h1 className={`text-2xl font-bold mb-2 ${statusConfig.textColor}`}>
                {statusConfig.title}
              </h1>
              
              <p className={`text-lg mb-6 ${statusConfig.textColor}`}>
                {statusConfig.subtitle}
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-3">Booking Details:</h3>
                <div className="space-y-2 text-sm">
                  {orderId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono">{orderId}</span>
                    </div>
                  )}
                  {talent && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Talent:</span>
                      <span>{talent}</span>
                    </div>
                  )}
                  {service && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span>{service}</span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">Rp {parseInt(amount).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg mb-6 ${statusConfig.bgColor}`}>
                <p className={`text-sm ${statusConfig.textColor}`}>
                  {getStatusMessage()}
                </p>
              </div>

              {status === 'success' && (
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-2">
                    Redirecting to dashboard in {countdown} seconds...
                  </Badge>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {status === 'success' && (
                  <Button 
                    onClick={() => navigate('/user-dashboard')}
                    className="flex items-center gap-2"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                
                {status === 'failed' && (
                  <>
                    <Button 
                      onClick={() => navigate('/booking?talent=1')}
                      className="flex items-center gap-2"
                    >
                      Try Again
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/contact')}
                    >
                      Contact Support
                    </Button>
                  </>
                )}

                {status === 'pending' && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/user-dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Process Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-center">Payment Process Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Secure Payment</h4>
                    <p className="text-gray-600">All payments are processed securely through Midtrans</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Processing Time</h4>
                    <p className="text-gray-600">Bank transfers may take 1-3 business days to process</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Payment Methods</h4>
                    <p className="text-gray-600">We support credit cards, bank transfers, e-wallets, and more</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
