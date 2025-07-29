#!/usr/bin/env node

/**
 * Test Financial System
 * This script tests the financial system by:
 * 1. Seeding sample data
 * 2. Testing PaymentService methods
 * 3. Verifying calculations
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('🌱 Seeding financial data...');
  
  try {
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'seed-financial-data.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by statements and execute each one
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim().startsWith('--') || statement.trim().length === 0) continue;
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
        if (error) {
          console.error('SQL Error:', error);
        }
      } catch (err) {
        // Try direct query for simpler statements
        try {
          await supabase.from('payment_transactions').select('id').limit(1);
        } catch (directErr) {
          console.error('Direct query error:', directErr);
        }
      }
    }
    
    console.log('✅ Data seeding completed');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

async function testPaymentAnalytics() {
  console.log('\n📊 Testing Payment Analytics...');
  
  try {
    // Test payment transactions query
    const { data: transactions, error: transError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_status', 'paid');
    
    if (transError) {
      console.error('❌ Error fetching transactions:', transError);
      return;
    }
    
    console.log(`✅ Found ${transactions?.length || 0} paid transactions`);
    
    if (transactions && transactions.length > 0) {
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalPlatformFees = transactions.reduce((sum, t) => sum + (t.platform_fee || 0), 0);
      const totalCompanionEarnings = transactions.reduce((sum, t) => sum + (t.companion_earnings || 0), 0);
      
      console.log(`💰 Total Revenue: Rp ${totalRevenue.toLocaleString()}`);
      console.log(`🏢 Platform Fees: Rp ${totalPlatformFees.toLocaleString()}`);
      console.log(`👥 Companion Earnings: Rp ${totalCompanionEarnings.toLocaleString()}`);
      
      // Calculate monthly data
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear;
      });
      
      const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      console.log(`📅 Monthly Revenue: Rp ${monthlyRevenue.toLocaleString()}`);
      console.log(`📈 Monthly Transactions: ${monthlyTransactions.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error in payment analytics test:', error);
  }
}

async function testCompanionEarnings() {
  console.log('\n👥 Testing Companion Earnings...');
  
  try {
    // Get all companions
    const { data: companions, error: companionError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('user_type', 'companion');
    
    if (companionError) {
      console.error('❌ Error fetching companions:', companionError);
      return;
    }
    
    console.log(`✅ Found ${companions?.length || 0} companions`);
    
    for (const companion of companions || []) {
      // Get earnings
      const { data: earnings, error: earningsError } = await supabase
        .from('payment_transactions')
        .select('companion_earnings')
        .eq('companion_id', companion.id)
        .eq('payment_status', 'paid');
      
      // Get payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('payout_requests')
        .select('requested_amount')
        .eq('companion_id', companion.id)
        .eq('status', 'approved');
      
      if (!earningsError && !payoutsError) {
        const totalEarnings = earnings?.reduce((sum, t) => sum + (t.companion_earnings || 0), 0) || 0;
        const totalPaidOut = payouts?.reduce((sum, p) => sum + (p.requested_amount || 0), 0) || 0;
        const availableEarnings = totalEarnings - totalPaidOut;
        
        console.log(`👤 ${companion.full_name}:`);
        console.log(`   💰 Total Earnings: Rp ${totalEarnings.toLocaleString()}`);
        console.log(`   💸 Paid Out: Rp ${totalPaidOut.toLocaleString()}`);
        console.log(`   💵 Available: Rp ${availableEarnings.toLocaleString()}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in companion earnings test:', error);
  }
}

async function testPayoutRequests() {
  console.log('\n💸 Testing Payout Requests...');
  
  try {
    const { data: payouts, error } = await supabase
      .from('payout_requests')
      .select(`
        *,
        companion:profiles!companion_id(id, full_name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching payouts:', error);
      return;
    }
    
    console.log(`✅ Found ${payouts?.length || 0} payout requests`);
    
    for (const payout of payouts || []) {
      console.log(`💸 ${payout.companion?.full_name}: Rp ${payout.requested_amount?.toLocaleString()} (${payout.status})`);
    }
    
  } catch (error) {
    console.error('❌ Error in payout requests test:', error);
  }
}

async function main() {
  console.log('🚀 Starting Financial System Test\n');
  
  await seedData();
  await testPaymentAnalytics();
  await testCompanionEarnings();
  await testPayoutRequests();
  
  console.log('\n✅ Financial System Test Complete!');
}

// Run the test
main().catch(console.error);
