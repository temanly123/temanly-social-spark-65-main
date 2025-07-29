/**
 * Create users with proper email formats that Supabase accepts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createWorkingUsers() {
  console.log('🚀 Creating users with working email formats...\n');
  
  // Create demo user with proper email
  console.log('👤 Creating Demo User...');
  try {
    const { data: demoData, error: demoError } = await supabase.auth.signUp({
      email: 'demo.user@gmail.com',
      password: 'demo123',
      options: {
        data: {
          user_type: 'client',
          name: 'Demo User'
        }
      }
    });
    
    if (demoError) {
      if (demoError.message.includes('User already registered')) {
        console.log('⚠️ Demo user already exists');
      } else {
        console.log(`❌ Demo signup failed: ${demoError.message}`);
      }
    } else {
      console.log('✅ Demo user created successfully!');
      console.log(`👤 User ID: ${demoData.user?.id}`);
    }
  } catch (error) {
    console.log(`💥 Demo user error: ${error.message}`);
  }
  
  // Test login with Amanda's existing account
  console.log('\n🧪 Testing Amanda\'s existing account...');
  try {
    const { data: amandaData, error: amandaError } = await supabase.auth.signInWithPassword({
      email: 'amandasoenoko@gmail.com',
      password: 'TalentPass123!'
    });
    
    if (amandaError) {
      console.log(`❌ Amanda login failed: ${amandaError.message}`);
      
      if (amandaError.message.includes('Email not confirmed')) {
        console.log('\n📧 Email confirmation needed for Amanda\'s account');
        console.log('🔧 Solution options:');
        console.log('1. Check email amandasoenoko@gmail.com for confirmation link');
        console.log('2. Disable email confirmation in Supabase dashboard');
        console.log('3. Use the demo account for testing');
      }
    } else {
      console.log('✅ Amanda login successful!');
      console.log(`👤 User ID: ${amandaData.user?.id}`);
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log(`💥 Amanda login error: ${error.message}`);
  }
  
  // Test demo login
  console.log('\n🧪 Testing demo login...');
  try {
    const { data: demoLoginData, error: demoLoginError } = await supabase.auth.signInWithPassword({
      email: 'demo.user@gmail.com',
      password: 'demo123'
    });
    
    if (demoLoginError) {
      console.log(`❌ Demo login failed: ${demoLoginError.message}`);
    } else {
      console.log('✅ Demo login successful!');
      console.log(`👤 User ID: ${demoLoginData.user?.id}`);
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log(`💥 Demo login error: ${error.message}`);
  }
  
  console.log('\n🎉 Results Summary:');
  console.log('\n📋 Working Credentials (if email confirmation disabled):');
  console.log('📧 Amanda: amandasoenoko@gmail.com');
  console.log('🔑 Password: TalentPass123!');
  console.log('\n📋 Demo Credentials:');
  console.log('📧 Demo: demo.user@gmail.com');
  console.log('🔑 Password: demo123');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Go to Supabase Dashboard → Authentication → Settings');
  console.log('2. Disable "Enable email confirmations"');
  console.log('3. Try logging in again with Amanda\'s credentials');
  console.log('4. Or use demo.user@gmail.com for testing');
}

// Run the script
createWorkingUsers();
