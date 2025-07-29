/**
 * Script to handle email confirmation issue
 * This will help us bypass email confirmation for testing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmailConfirmation() {
  console.log('🔍 Testing email confirmation bypass...\n');
  
  // Try different approaches to login
  const email = 'amandasoenoko@gmail.com';
  const password = 'TalentPass123!';
  
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  
  // Method 1: Try normal login
  console.log('\n🧪 Method 1: Normal login...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.log(`❌ Normal login failed: ${error.message}`);
      
      if (error.message.includes('Email not confirmed')) {
        console.log('📧 Email confirmation required');
        
        // Method 2: Try to resend confirmation
        console.log('\n🧪 Method 2: Resending confirmation email...');
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email
        });
        
        if (resendError) {
          console.log(`❌ Resend failed: ${resendError.message}`);
        } else {
          console.log(`✅ Confirmation email sent to ${email}`);
          console.log('📬 Check your email and click the confirmation link');
        }
      }
    } else {
      console.log(`✅ Login successful!`);
      console.log(`👤 User ID: ${data.user?.id}`);
      console.log(`📧 User Email: ${data.user?.email}`);
      console.log(`✅ Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}`);
      
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log(`💥 Unexpected error: ${error.message}`);
  }
  
  // Method 3: Create a new user with a different email for testing
  console.log('\n🧪 Method 3: Creating test user with different email...');
  const testEmail = 'test@example.com';
  const testPassword = 'TestPass123!';
  
  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          user_type: 'talent',
          name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      if (signupError.message.includes('User already registered')) {
        console.log(`⚠️ Test user already exists`);
        
        // Try to login with test user
        const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (testLoginError) {
          console.log(`❌ Test login failed: ${testLoginError.message}`);
        } else {
          console.log(`✅ Test user login successful!`);
          await supabase.auth.signOut();
        }
      } else {
        console.log(`❌ Test signup failed: ${signupError.message}`);
      }
    } else {
      console.log(`✅ Test user created: ${testEmail}`);
      console.log(`👤 User ID: ${signupData.user?.id}`);
      
      // Try to login immediately
      const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (testLoginError) {
        console.log(`❌ Test login failed: ${testLoginError.message}`);
      } else {
        console.log(`✅ Test user login successful immediately!`);
        await supabase.auth.signOut();
      }
    }
  } catch (error) {
    console.log(`💥 Test user error: ${error.message}`);
  }
  
  console.log('\n📋 Summary:');
  console.log('1. Amanda\'s user exists but needs email confirmation');
  console.log('2. Check your email for confirmation link');
  console.log('3. Or we can disable email confirmation in Supabase settings');
  console.log('4. Alternative: Use a test email that doesn\'t require confirmation');
}

// Run the test
testEmailConfirmation();
