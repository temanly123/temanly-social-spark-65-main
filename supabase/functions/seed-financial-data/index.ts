import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🌱 Starting financial data seeding...');

    // Payment calculation helper
    const calculatePaymentBreakdown = (serviceAmount: number, talentLevel: 'fresh' | 'elite' | 'vip') => {
      const commissionRates = { fresh: 20, elite: 18, vip: 15 };
      const commissionRate = commissionRates[talentLevel];
      const appFeeRate = 10;
      
      const appFee = Math.round(serviceAmount * (appFeeRate / 100));
      const commission = Math.round(serviceAmount * (commissionRate / 100));
      const talentEarnings = serviceAmount - commission;
      const totalChargedToCustomer = serviceAmount + appFee;
      
      return {
        serviceAmount,
        appFee,
        commission,
        talentEarnings,
        totalChargedToCustomer,
        commissionRate
      };
    };

    const createTransaction = (serviceAmount: number, talentLevel: 'fresh' | 'elite' | 'vip') => {
      const breakdown = calculatePaymentBreakdown(serviceAmount, talentLevel);
      return {
        amount: breakdown.totalChargedToCustomer,
        platform_fee: breakdown.appFee,
        companion_earnings: breakdown.talentEarnings,
        commission_rate: breakdown.commissionRate
      };
    };

    // 1. Create companion profiles
    const companions = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'yasmina@temanly.com',
        name: 'Yasmina Dwiariani',
        full_name: 'Yasmina Dwiariani',
        phone: '+6281234567890',
        user_type: 'companion',
        verification_status: 'verified',
        status: 'active',
        talent_level: 'vip',
        age: 24,
        location: 'Jakarta',
        bio: 'Elegant and sophisticated companion for upscale events',
        city: 'Jakarta',
        average_rating: 4.9,
        total_orders: 15,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'amanda@temanly.com',
        name: 'Amanda Soenoko',
        full_name: 'Amanda Soenoko',
        phone: '+6281234567891',
        user_type: 'companion',
        verification_status: 'verified',
        status: 'active',
        talent_level: 'elite',
        age: 23,
        location: 'Jakarta',
        bio: 'Charming and intelligent companion for various occasions',
        city: 'Jakarta',
        average_rating: 4.7,
        total_orders: 12,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'sarah@temanly.com',
        name: 'Sarah Johnson',
        full_name: 'Sarah Johnson',
        phone: '+6281234567892',
        user_type: 'companion',
        verification_status: 'verified',
        status: 'active',
        talent_level: 'fresh',
        age: 22,
        location: 'Jakarta',
        bio: 'Friendly and energetic companion for fun activities',
        city: 'Jakarta',
        average_rating: 4.5,
        total_orders: 8,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // 2. Create customer profiles
    const customers = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'customer1@example.com',
        name: 'John Doe',
        full_name: 'John Doe',
        phone: '+6281234567893',
        user_type: 'user',
        verification_status: 'verified',
        status: 'active',
        age: 28,
        location: 'Jakarta',
        city: 'Jakarta',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'customer2@example.com',
        name: 'Michael Smith',
        full_name: 'Michael Smith',
        phone: '+6281234567894',
        user_type: 'user',
        verification_status: 'verified',
        status: 'active',
        age: 32,
        location: 'Jakarta',
        city: 'Jakarta',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'customer3@example.com',
        name: 'David Wilson',
        full_name: 'David Wilson',
        phone: '+6281234567895',
        user_type: 'user',
        verification_status: 'verified',
        status: 'active',
        age: 35,
        location: 'Jakarta',
        city: 'Jakarta',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    // Insert profiles
    console.log('📝 Inserting profiles...');
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([...companions, ...customers]);

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    // 3. Create payment transactions
    const transactions = [
      {
        id: '10000001-1000-4000-8000-100000000001',
        user_id: '44444444-4444-4444-4444-444444444444',
        companion_id: '11111111-1111-1111-1111-111111111111',
        ...createTransaction(255000, 'vip'),
        service_name: 'Dinner Companion',
        service_type: 'offline_date',
        duration: 3,
        payment_status: 'paid',
        payment_method: 'midtrans',
        midtrans_order_id: 'ORDER-2024011501',
        created_at: '2024-01-15T16:00:00Z',
        updated_at: '2024-01-15T19:30:00Z',
        paid_at: '2024-01-15T19:30:00Z'
      },
      {
        id: '10000002-1000-4000-8000-100000000002',
        user_id: '55555555-5555-5555-5555-555555555555',
        companion_id: '22222222-2222-2222-2222-222222222222',
        ...createTransaction(300000, 'elite'),
        service_name: 'Event Companion',
        service_type: 'party_buddy',
        duration: 4,
        payment_status: 'paid',
        payment_method: 'midtrans',
        midtrans_order_id: 'ORDER-2024012001',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        paid_at: '2024-01-20T14:30:00Z'
      },
      {
        id: '10000003-1000-4000-8000-100000000003',
        user_id: '66666666-6666-6666-6666-666666666666',
        companion_id: '33333333-3333-3333-3333-333333333333',
        ...createTransaction(570000, 'fresh'),
        service_name: 'Business Companion',
        service_type: 'offline_date',
        duration: 6,
        payment_status: 'paid',
        payment_method: 'midtrans',
        midtrans_order_id: 'ORDER-2024012501',
        created_at: '2024-01-25T07:00:00Z',
        updated_at: '2024-01-25T09:30:00Z',
        paid_at: '2024-01-25T09:30:00Z'
      }
    ];

    console.log('💳 Inserting payment transactions...');
    const { error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .upsert(transactions);

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      throw transactionError;
    }

    console.log('✅ Financial data seeded successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Financial data seeded successfully!',
        data: {
          profiles: companions.length + customers.length,
          transactions: transactions.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error seeding financial data:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
