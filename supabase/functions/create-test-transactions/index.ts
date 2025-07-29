import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🧪 Creating test transactions...');

    // Create test transactions
    const testTransactions = [
      {
        id: 'TEST_TXN_001',
        amount: 75000,
        service: 'Video Call',
        payment_method: 'midtrans',
        status: 'paid',
        user_id: '00000000-0000-0000-0000-000000000001',
        companion_id: '00000000-0000-0000-0000-000000000002',
        booking_id: 'BOOK_001',
        platform_fee: 7500,
        companion_earnings: 67500,
        duration: 1,
        payment_reference: 'TEST_TXN_001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        midtrans_data: {
          snap_token: 'test_token_001',
          payment_type: 'credit_card',
          transaction_status: 'settlement'
        },
        midtrans_response: {
          transaction_status: 'settlement',
          payment_type: 'credit_card',
          gross_amount: '75000',
          transaction_time: new Date().toISOString(),
          settlement_time: new Date().toISOString()
        }
      },
      {
        id: 'TEST_TXN_002',
        amount: 25000,
        service: 'Chat',
        payment_method: 'midtrans',
        status: 'pending',
        user_id: '00000000-0000-0000-0000-000000000003',
        companion_id: '00000000-0000-0000-0000-000000000004',
        booking_id: 'BOOK_002',
        platform_fee: 2500,
        companion_earnings: 22500,
        duration: 1,
        payment_reference: 'TEST_TXN_002',
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        midtrans_data: {
          snap_token: 'test_token_002',
          payment_type: 'bank_transfer',
          transaction_status: 'pending'
        }
      },
      {
        id: 'TEST_TXN_003',
        amount: 285000,
        service: 'Offline Date',
        payment_method: 'midtrans',
        status: 'paid',
        user_id: '00000000-0000-0000-0000-000000000005',
        companion_id: '00000000-0000-0000-0000-000000000006',
        booking_id: 'BOOK_003',
        platform_fee: 28500,
        companion_earnings: 256500,
        duration: 3,
        payment_reference: 'TEST_TXN_003',
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        updated_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        midtrans_data: {
          snap_token: 'test_token_003',
          payment_type: 'gopay',
          transaction_status: 'settlement'
        },
        midtrans_response: {
          transaction_status: 'settlement',
          payment_type: 'gopay',
          gross_amount: '285000',
          transaction_time: new Date(Date.now() - 7200000).toISOString(),
          settlement_time: new Date(Date.now() - 1800000).toISOString()
        }
      },
      {
        id: 'TEST_TXN_004',
        amount: 40000,
        service: 'Voice Call',
        payment_method: 'midtrans',
        status: 'failed',
        user_id: '00000000-0000-0000-0000-000000000007',
        companion_id: '00000000-0000-0000-0000-000000000008',
        booking_id: 'BOOK_004',
        platform_fee: 4000,
        companion_earnings: 36000,
        duration: 1,
        payment_reference: 'TEST_TXN_004',
        created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
        updated_at: new Date(Date.now() - 9000000).toISOString(), // 2.5 hours ago
        midtrans_data: {
          snap_token: 'test_token_004',
          payment_type: 'credit_card',
          transaction_status: 'deny'
        },
        midtrans_response: {
          transaction_status: 'deny',
          payment_type: 'credit_card',
          gross_amount: '40000',
          transaction_time: new Date(Date.now() - 10800000).toISOString(),
          status_code: '202'
        }
      },
      {
        id: 'TEST_TXN_005',
        amount: 65000,
        service: 'Video Call',
        payment_method: 'midtrans',
        status: 'paid',
        user_id: '00000000-0000-0000-0000-000000000009',
        companion_id: '00000000-0000-0000-0000-000000000010',
        booking_id: 'BOOK_005',
        platform_fee: 6500,
        companion_earnings: 58500,
        duration: 1,
        payment_reference: 'TEST_TXN_005',
        created_at: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
        updated_at: new Date(Date.now() - 12600000).toISOString(), // 3.5 hours ago
        midtrans_data: {
          snap_token: 'test_token_005',
          payment_type: 'bank_transfer',
          transaction_status: 'settlement'
        },
        midtrans_response: {
          transaction_status: 'settlement',
          payment_type: 'bank_transfer',
          gross_amount: '65000',
          transaction_time: new Date(Date.now() - 14400000).toISOString(),
          settlement_time: new Date(Date.now() - 12600000).toISOString(),
          va_number: '1234567890123456'
        }
      }
    ];

    console.log(`📝 Inserting ${testTransactions.length} test transactions...`);

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert(testTransactions)
      .select();

    if (error) {
      console.error('❌ Error inserting test transactions:', error);
      throw error;
    }

    console.log('✅ Test transactions created successfully:', data?.length);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${data?.length} test transactions`,
        transactions: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error in create-test-transactions:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
