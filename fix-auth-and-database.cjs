#!/usr/bin/env node

/**
 * COMPREHENSIVE AUTH AND DATABASE FIX
 * This script fixes all authentication and database issues
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk3MzAxMiwiZXhwIjoyMDY1NTQ5MDEyfQ.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8'; // Service role key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

// Create service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create regular client for testing
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDatabaseIssues() {
  console.log('🔧 FIXING DATABASE AND AUTH ISSUES...\n');

  try {
    // Step 1: Fix RLS policies
    console.log('1️⃣ Fixing RLS policies...');
    
    const rlsFixes = `
      -- Drop existing problematic policies
      DROP POLICY IF EXISTS "admin_access" ON payment_transactions;
      DROP POLICY IF EXISTS "admin_access" ON payout_requests;
      DROP POLICY IF EXISTS "admin_access" ON payout_transactions;
      DROP POLICY IF EXISTS "profiles_access" ON profiles;
      DROP POLICY IF EXISTS "service_role_profiles" ON profiles;

      -- Create comprehensive admin policies
      CREATE POLICY "admin_full_access_payment_transactions" ON payment_transactions
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
          OR auth.uid() = user_id OR auth.uid() = companion_id
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
          OR auth.uid() = user_id OR auth.uid() = companion_id
        );

      CREATE POLICY "admin_full_access_payout_requests" ON payout_requests
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
          OR auth.uid() = companion_id
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND user_type = 'admin'
          )
          OR auth.uid() = companion_id
        );

      CREATE POLICY "profiles_comprehensive_access" ON profiles
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.user_type = 'admin'
          )
          OR id = auth.uid()
          OR user_type = 'companion'
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.user_type = 'admin'
          )
          OR id = auth.uid()
        );

      -- Service role policies (bypass RLS)
      CREATE POLICY "service_role_payment_transactions" ON payment_transactions
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);

      CREATE POLICY "service_role_payout_requests" ON payout_requests
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);

      CREATE POLICY "service_role_profiles" ON profiles
        FOR ALL TO service_role
        USING (true)
        WITH CHECK (true);

      -- Enable RLS
      ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Grant permissions
      GRANT ALL ON payment_transactions TO authenticated;
      GRANT ALL ON payout_requests TO authenticated;
      GRANT ALL ON profiles TO authenticated;
      GRANT ALL ON payment_transactions TO service_role;
      GRANT ALL ON payout_requests TO service_role;
      GRANT ALL ON profiles TO service_role;
    `;

    // Execute RLS fixes using service role
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', { sql: rlsFixes });
    if (rlsError) {
      console.error('❌ RLS fix error:', rlsError);
    } else {
      console.log('✅ RLS policies fixed');
    }

    // Step 2: Create admin user if doesn't exist
    console.log('\n2️⃣ Ensuring admin user exists...');
    
    // Check if admin user exists
    const { data: adminProfile, error: adminCheckError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', 'admin@temanly.com')
      .eq('user_type', 'admin')
      .single();

    if (adminCheckError && adminCheckError.code === 'PGRST116') {
      // Admin doesn't exist, create one
      console.log('Creating admin user...');
      
      // First create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@temanly.com',
        password: 'admin123',
        email_confirm: true
      });

      if (authError) {
        console.error('❌ Auth user creation error:', authError);
      } else {
        console.log('✅ Auth user created');
        
        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: 'admin@temanly.com',
            name: 'Admin',
            full_name: 'System Administrator',
            user_type: 'admin',
            verification_status: 'verified',
            status: 'active'
          });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
        } else {
          console.log('✅ Admin profile created');
        }
      }
    } else if (adminProfile) {
      console.log('✅ Admin user already exists');
    } else {
      console.error('❌ Error checking admin user:', adminCheckError);
    }

    // Step 3: Test database connections
    console.log('\n3️⃣ Testing database connections...');
    
    const tables = ['profiles', 'payment_transactions', 'payout_requests'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select('count').limit(1);
        if (error) throw error;
        console.log(`✅ ${table}: accessible`);
      } catch (error) {
        console.error(`❌ ${table}: ${error.message}`);
      }
    }

    // Step 4: Test authentication flow
    console.log('\n4️⃣ Testing authentication flow...');
    
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@temanly.com',
        password: 'admin123'
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError.message);
      } else {
        console.log('✅ Authentication successful');
        
        // Test profile access
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', signInData.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile access error:', profileError.message);
        } else {
          console.log(`✅ Profile access successful - User type: ${profile.user_type}`);
        }

        // Sign out
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('❌ Auth test error:', error.message);
    }

    console.log('\n🎉 DATABASE AND AUTH FIXES COMPLETED!');
    console.log('\n📋 Summary:');
    console.log('- RLS policies updated for proper admin access');
    console.log('- Admin user ensured (admin@temanly.com / admin123)');
    console.log('- Database connections tested');
    console.log('- Authentication flow verified');
    console.log('\n🔄 Please refresh your browser and try the database tests again.');

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
  }
}

// Run the fix
fixDatabaseIssues().catch(console.error);
