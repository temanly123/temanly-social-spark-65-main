# Deploy Midtrans Webhook to Supabase

## Option 1: Using Supabase CLI (if available)
```bash
supabase functions deploy midtrans-webhook
```

## Option 2: Manual Deployment via Dashboard

1. **Go to Supabase Dashboard** → Your Project → Edge Functions
2. **Create New Function** named `midtrans-webhook`
3. **Copy the content** from `supabase/functions/midtrans-webhook/index.ts`
4. **Deploy the function**

## Option 3: Copy-Paste Method

If you can't use CLI, copy this content to create the function manually:

### Function Code:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    console.log('Midtrans webhook received:', body)

    const orderId = body.order_id
    
    // Find the payment transaction
    const { data: transaction, error: findError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('midtrans_order_id', orderId)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', orderId)
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine payment status
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
      default:
        paymentStatus = 'pending'
    }

    // Update payment transaction
    const { error: updateError } = await supabase
      .from('payment_transactions')
      .update({
        midtrans_transaction_id: body.transaction_id,
        midtrans_payment_type: body.payment_type,
        midtrans_transaction_status: body.transaction_status,
        midtrans_fraud_status: body.fraud_status,
        midtrans_settlement_time: body.settlement_time,
        midtrans_raw_response: body,
        payment_status: paymentStatus,
        paid_at: paidAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Failed to update transaction:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        order_id: orderId,
        status: paymentStatus
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Environment Variables to Set in Supabase:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key
- `MIDTRANS_SERVER_KEY`: Your Midtrans server key

## Webhook URL Format:
`https://your-project-id.supabase.co/functions/v1/midtrans-webhook`
