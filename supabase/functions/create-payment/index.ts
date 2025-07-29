
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
    const { booking_data, amount, order_id } = await req.json();
    
    console.log('Create payment request:', { booking_data, amount, order_id });
    
    if (!booking_data || !amount) {
      throw new Error("Missing required fields: booking_data or amount");
    }

    console.log('📋 Processing payment request:', {
      booking_data,
      amount,
      order_id
    });

    // Generate order ID if not provided
    const finalOrderId = order_id || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get Midtrans Server Key from Supabase secrets
    const serverKey = Deno.env.get("MIDTRANS_SERVER_KEY");

    if (!serverKey) {
      console.error("Midtrans Server Key not found in environment");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment service configuration error. Please contact support."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Prepare Midtrans transaction parameters for production
    const parameter = {
      transaction_details: {
        order_id: finalOrderId,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      item_details: [
        {
          id: booking_data.service?.toLowerCase().replace(' ', '_') || 'service',
          price: amount,
          quantity: 1,
          name: `${booking_data.service || 'Service'} with ${booking_data.talent || 'Talent'}`,
        },
      ],
      customer_details: {
        first_name: "Customer",
        email: "customer@temanly.com",
        phone: "+628123456789",
      },
      // Enable all production payment methods
      enabled_payments: [
        "credit_card", 
        "bca_va", "bni_va", "bri_va", "cimb_va", "echannel", "permata_va", "other_va",
        "gopay", "shopeepay", "dana", "ovo", "linkaja", "jenius",
        "cstore", "alfamart", "indomaret",
        "qris"
      ],
      // Production notification URL
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/midtrans-notification`,
      // Set expiry time (30 minutes) - Format: yyyy-MM-dd HH:mm:ss Z
      expiry: {
        start_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' ') + ' +0700',
        unit: "minutes",
        duration: 30
      }
    };

    console.log('Creating Midtrans transaction with parameter:', JSON.stringify(parameter, null, 2));

    // Create transaction to Midtrans Snap API (Production)
    const midtransResponse = await fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(serverKey + ':')}`,
      },
      body: JSON.stringify(parameter),
    });

    if (!midtransResponse.ok) {
      const errorText = await midtransResponse.text();
      console.error('Midtrans API Error:', errorText);
      throw new Error(`Midtrans API Error (${midtransResponse.status}): ${errorText}`);
    }

    const midtransData = await midtransResponse.json();
    console.log('Midtrans response received:', midtransData);

    // Create Supabase client for saving transaction
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });

      // Save comprehensive transaction record to database
      const transactionRecord = {
        id: finalOrderId,
        amount: amount,
        service: booking_data.service || 'Unknown Service',
        payment_method: 'midtrans',
        status: 'pending',
        booking_data: booking_data,
        midtrans_token: midtransData.token,
        payment_reference: finalOrderId,
        user_id: booking_data.user_id || null,
        companion_id: booking_data.companion_id || null,
        booking_id: booking_data.booking_id || null,
        platform_fee: Math.round(amount * 0.1), // 10% platform fee
        companion_earnings: Math.round(amount * 0.9), // 90% to companion
        duration: booking_data.duration || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Additional Midtrans tracking data
        midtrans_data: {
          snap_token: midtransData.token,
          redirect_url: midtransData.redirect_url,
          payment_methods: parameter.enabled_payments,
          expiry_time: parameter.expiry,
          customer_details: parameter.customer_details,
          item_details: parameter.item_details
        }
      };

      console.log('Saving comprehensive transaction record:', JSON.stringify(transactionRecord, null, 2));

      const { error: insertError } = await supabaseAdmin
        .from('transactions')
        .insert(transactionRecord);

      if (insertError) {
        console.error('Error saving transaction to database:', insertError);
        // Log the error but don't fail the payment creation
        console.error('Transaction record that failed:', JSON.stringify(transactionRecord, null, 2));
      } else {
        console.log(`✅ Transaction ${finalOrderId} saved successfully to database`);
      }
    }

    return new Response(
      JSON.stringify({ 
        token: midtransData.token,
        redirect_url: midtransData.redirect_url,
        order_id: finalOrderId,
        success: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in create-payment function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Check function logs for more information',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
