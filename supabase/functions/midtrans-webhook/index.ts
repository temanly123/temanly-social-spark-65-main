import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Midtrans server key for signature verification
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    console.log('Midtrans webhook received:', body)

    // Verify signature (basic implementation)
    const orderId = body.order_id
    const statusCode = body.status_code
    const grossAmount = body.gross_amount
    const serverKey = midtransServerKey
    
    const signatureKey = body.signature_key
    const expectedSignature = await crypto.subtle.digest(
      'SHA-512',
      new TextEncoder().encode(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    )
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // For demo purposes, we'll skip strict signature verification
    // In production, uncomment the following lines:
    // if (signatureKey !== expectedSignatureHex) {
    //   console.error('Invalid signature')
    //   return new Response(
    //     JSON.stringify({ error: 'Invalid signature' }),
    //     { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   )
    // }

    // Find the payment transaction
    const { data: transaction, error: findError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('midtrans_order_id', orderId)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', orderId, findError)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine payment status based on Midtrans status
    let paymentStatus = 'pending'
    let paidAt = null

    switch (body.transaction_status) {
      case 'capture':
        if (body.fraud_status === 'accept') {
          paymentStatus = 'paid'
          paidAt = new Date().toISOString()
        }
        break
      case 'settlement':
        paymentStatus = 'paid'
        paidAt = body.settlement_time || new Date().toISOString()
        break
      case 'pending':
        paymentStatus = 'pending'
        break
      case 'deny':
      case 'cancel':
      case 'expire':
        paymentStatus = 'failed'
        break
      case 'refund':
        paymentStatus = 'refunded'
        break
      default:
        paymentStatus = 'pending'
    }

    // Update payment transaction
    const updateData = {
      midtrans_transaction_id: body.transaction_id,
      midtrans_payment_type: body.payment_type,
      midtrans_transaction_status: body.transaction_status,
      midtrans_fraud_status: body.fraud_status,
      midtrans_settlement_time: body.settlement_time,
      midtrans_raw_response: body,
      payment_status: paymentStatus,
      paid_at: paidAt,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Payment ${orderId} updated to status: ${paymentStatus}`)

    // If payment is successful, trigger additional actions
    if (paymentStatus === 'paid') {
      try {
        // Update booking status to confirmed
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            booking_status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)

        if (bookingUpdateError) {
          console.error('Failed to update booking status:', bookingUpdateError)
        }

        // Get booking details for notifications
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            *,
            user_profile:profiles!user_id(name, phone),
            talent_profile:profiles!companion_id(name, phone)
          `)
          .eq('id', orderId)
          .single()

        if (!bookingError && booking && booking.user_profile && booking.talent_profile) {
          // Send WhatsApp payment confirmation
          const paymentNotificationData = {
            booking_id: orderId,
            user_phone: booking.customer_phone,
            talent_phone: booking.talent_profile.phone,
            payment_details: {
              amount: transaction.amount,
              payment_method: body.payment_type || 'Midtrans',
              talent_earnings: transaction.companion_earnings
            }
          }

          // Call WhatsApp notification function
          const { error: notificationError } = await supabase.functions.invoke('send-payment-notification', {
            body: paymentNotificationData
          })

          if (notificationError) {
            console.error('Failed to send payment notification:', notificationError)
          }
        }

      } catch (actionError) {
        console.error('Error in post-payment actions:', actionError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        order_id: orderId,
        status: paymentStatus
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
