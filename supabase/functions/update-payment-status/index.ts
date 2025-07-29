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
    const { order_id, status, transaction_status } = await req.json();
    
    console.log('Update payment status request:', { order_id, status, transaction_status });
    
    if (!order_id || !status) {
      throw new Error("Missing required fields: order_id or status");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update payment status
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    // If it's a settlement, add settlement time
    if (status === 'paid' || transaction_status === 'settlement') {
      updateData.settlement_time = new Date().toISOString();
      updateData.status = 'paid';
    }

    // Update midtrans_data if transaction_status is provided
    if (transaction_status) {
      updateData.midtrans_data = {
        transaction_status: transaction_status,
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('order_id', order_id)
      .select();

    if (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }

    console.log('Payment status updated successfully:', data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment status updated successfully",
        data: data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in update-payment-status function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
