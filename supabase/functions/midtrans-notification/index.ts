
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification = await req.json();
    console.log('Midtrans notification received:', notification);

    // Get Midtrans Server Key from Supabase secrets
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!serverKey) {
      throw new Error("Midtrans Server Key not configured");
    }

    // Verify notification signature for security
    const { order_id, status_code, gross_amount, signature_key } = notification;
    const expectedSignature = await crypto.subtle.digest(
      'SHA-512',
      new TextEncoder().encode(`${order_id}${status_code}${gross_amount}${serverKey}`)
    );
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature_key !== expectedSignatureHex) {
      console.error('Invalid signature from Midtrans notification');
      throw new Error("Invalid signature");
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Extract comprehensive notification data
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      settlement_time,
      bank,
      va_number,
      biller_code,
      bill_key
    } = notification;

    console.log('Processing Midtrans notification:', {
      order_id,
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount,
      transaction_time
    });

    // Update transaction status based on Midtrans notification
    let newStatus = 'pending';
    let paymentStatus = 'pending';
    
    switch (notification.transaction_status) {
      case 'capture':
        if (notification.fraud_status === 'accept') {
          newStatus = 'paid';
          paymentStatus = 'paid';
        } else if (notification.fraud_status === 'challenge') {
          newStatus = 'challenge';
          paymentStatus = 'pending';
        } else {
          newStatus = 'failed';
          paymentStatus = 'failed';
        }
        break;
      case 'settlement':
        newStatus = 'paid';
        paymentStatus = 'paid';
        break;
      case 'pending':
        newStatus = 'pending';
        paymentStatus = 'pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        newStatus = 'failed';
        paymentStatus = 'failed';
        break;
      case 'refund':
        newStatus = 'refunded';
        paymentStatus = 'refunded';
        break;
      default:
        newStatus = 'unknown';
        paymentStatus = 'pending';
    }

    console.log(`Updating transaction ${order_id} to status: ${newStatus}`);

    // Prepare comprehensive update data
    const updateData = {
      status: newStatus,
      midtrans_response: notification,
      updated_at: new Date().toISOString(),
      // Add specific payment details
      payment_type: payment_type,
      transaction_time: transaction_time,
      settlement_time: settlement_time || null,
    };

    // If payment is successful, add confirmation timestamp
    if (paymentStatus === 'paid') {
      updateData.payment_confirmed_at = new Date().toISOString();
      updateData.settlement_time = settlement_time || new Date().toISOString();
    }

    console.log('Updating transaction with data:', JSON.stringify(updateData, null, 2));

    // Update transaction in database
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    console.log(`✅ Transaction ${order_id} updated successfully with status: ${newStatus}`);

    // If payment is successful, update any related booking records
    if (paymentStatus === 'paid') {
      console.log(`Payment confirmed for order ${order_id}, updating booking status`);
      
      // Update booking status if exists
      await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', order_id);

      console.log(`Booking updated to confirmed status for order ${order_id}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification processed successfully',
        order_id: order_id,
        status: newStatus
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error processing Midtrans notification:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
