
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { ENV } from '@/config/env';

declare global {
  interface Window {
    snap: any;
  }
}

interface MidtransPaymentProps {
  bookingData: {
    talent: string;
    service: string;
    date: Date;
    time: string;
    message: string;
    total: number;
  };
  onSuccess: (result: any) => void;
  onPending: (result: any) => void;
  onError: (result: any) => void;
  disabled?: boolean;
}

const MidtransPayment: React.FC<MidtransPaymentProps> = ({
  bookingData,
  onSuccess,
  onPending,
  onError,
  disabled = false
}) => {
  const [loading, setLoading] = React.useState(false);
  const [snapLoaded, setSnapLoaded] = React.useState(false);

  useEffect(() => {
    // Load Midtrans Snap script with production client key
    const script = document.createElement('script');
    script.src = 'https://app.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', ENV.MIDTRANS_CLIENT_KEY || 'Mid-client-t14R0G6XRLw9MLZj');
    script.onload = () => {
      console.log('Midtrans Snap script loaded successfully');
      setSnapLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Midtrans Snap script');
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const processPayment = async () => {
    if (!snapLoaded) {
      console.error('Midtrans Snap not loaded');
      onError({ message: 'Payment system not ready. Please refresh and try again.' });
      return;
    }

    setLoading(true);
    console.log('Starting payment process with booking data:', bookingData);
    
    try {
      // Generate unique order ID
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use environment configuration instead of import.meta.env
      const supabaseUrl = ENV.SUPABASE_URL;
      const supabaseKey = ENV.SUPABASE_ANON_KEY;
      
      console.log('Using Supabase URL:', supabaseUrl);
      
      // Call Supabase Edge Function to create Midtrans transaction
      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          booking_data: bookingData,
          amount: bookingData.total,
          order_id: orderId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment service error:', errorText);

        // Special handling for 404 - function not deployed
        if (response.status === 404) {
          throw new Error(`Payment function not deployed. Please deploy the 'create-payment' edge function to Supabase. See DEPLOY_EDGE_FUNCTIONS.md for instructions.`);
        }

        throw new Error(`Payment service error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Payment service response:', responseData);

      if (!responseData.token) {
        throw new Error('No payment token received from server');
      }

      const { token, order_id } = responseData;
      console.log('Midtrans token received:', token);

      // Open Midtrans payment popup
      window.snap.pay(token, {
        onSuccess: (result: any) => {
          console.log('Payment success:', result);
          onSuccess({
            ...result,
            order_id: order_id
          });
          setLoading(false);
        },
        onPending: (result: any) => {
          console.log('Payment pending:', result);
          onPending({
            ...result,
            order_id: order_id
          });
          setLoading(false);
        },
        onError: (result: any) => {
          console.log('Payment error:', result);
          onError(result);
          setLoading(false);
        },
        onClose: () => {
          console.log('Payment popup closed by user');
          setLoading(false);
        }
      });

    } catch (error) {
      console.error('Payment processing error:', error);
      onError({ 
        message: error instanceof Error ? error.message : 'Payment processing failed. Please try again.' 
      });
      setLoading(false);
    }
  };

  return (
    <Button 
      className="w-full" 
      size="lg"
      onClick={processPayment}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing Payment...
        </>
      ) : !snapLoaded ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading Payment System...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pay Now - Rp {bookingData.total.toLocaleString()}
        </>
      )}
    </Button>
  );
};

export default MidtransPayment;
