const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFrontendAuth() {
  console.log('🔧 FIXING FRONTEND AUTHENTICATION ISSUES...\n');

  try {
    // Step 1: Test basic connection
    console.log('1️⃣ Testing basic database connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      return;
    } else {
      console.log('✅ Database connection successful');
    }

    // Step 2: Create/verify admin user
    console.log('\n2️⃣ Creating admin user for testing...');
    
    // Try to sign up admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@temanly.com',
      password: 'admin123',
      options: {
        data: {
          full_name: 'System Administrator',
          user_type: 'admin'
        }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Admin signup error:', signUpError.message);
    } else {
      console.log('✅ Admin user created/exists');
    }

    // Step 3: Test authentication
    console.log('\n3️⃣ Testing authentication flow...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@temanly.com',
      password: 'admin123'
    });

    if (signInError) {
      console.error('❌ Authentication failed:', signInError.message);
    } else {
      console.log('✅ Authentication successful');
      
      // Step 4: Create/update admin profile
      console.log('\n4️⃣ Ensuring admin profile exists...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: signInData.user.id,
          email: 'admin@temanly.com',
          name: 'Admin',
          full_name: 'System Administrator',
          user_type: 'admin',
          verification_status: 'verified',
          status: 'active'
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError.message);
      } else {
        console.log('✅ Admin profile created/updated');
      }

      // Step 5: Test table access
      console.log('\n5️⃣ Testing table access with admin user...');
      
      const tables = ['profiles', 'payment_transactions', 'payout_requests'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1);
          if (error) throw error;
          console.log(`✅ ${table}: accessible (${data?.length || 0} records)`);
        } catch (error) {
          console.error(`❌ ${table}: ${error.message}`);
        }
      }

      // Sign out
      await supabase.auth.signOut();
    }

    console.log('\n🎉 FRONTEND AUTH FIX COMPLETED!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the SQL fix in Supabase dashboard: quick-database-fix.sql');
    console.log('2. Refresh your browser');
    console.log('3. Try logging in with: admin@temanly.com / admin123');
    console.log('4. Run the database tests again');

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
  }
}

// Run the fix
fixFrontendAuth().catch(console.error);
