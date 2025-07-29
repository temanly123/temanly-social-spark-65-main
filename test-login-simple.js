/**
 * Simple script to test login with different credentials
 * This helps debug the login issue
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password, description) {
  console.log(`\n🧪 Testing ${description}...`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.log(`❌ Login failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Login successful!`);
      console.log(`👤 User ID: ${data.user?.id}`);
      console.log(`📧 User Email: ${data.user?.email}`);
      console.log(`🏷️ User Metadata:`, data.user?.user_metadata);
      
      // Sign out after test
      await supabase.auth.signOut();
      return true;
    }
  } catch (error) {
    console.log(`💥 Unexpected error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Testing different login credentials...\n');
  
  // Test 1: Demo credentials
  await testLogin('demo@temanly.com', 'demo123', 'Demo Credentials');
  
  // Test 2: Amanda's email with simple password
  await testLogin('amandasoenoko@gmail.com', 'TalentPass123!', 'Amanda with simple password');
  
  // Test 3: Amanda's email with generated password pattern
  await testLogin('amandasoenoko@gmail.com', 'Talent123456!', 'Amanda with generated password pattern');
  
  // Test 4: Check what users exist (this won't work with anon key, but let's try)
  console.log('\n🔍 Checking auth state...');
  try {
    const { data: session } = await supabase.auth.getSession();
    console.log('Current session:', session.session ? 'Active' : 'None');
  } catch (error) {
    console.log('Session check error:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('- If demo login works, Supabase auth is working');
  console.log('- If Amanda login fails, the user needs to be created');
  console.log('- Check your admin panel for the actual generated password');
  console.log('- You may need to run the user creation script with service role key');
}

// Run the tests
runTests();
