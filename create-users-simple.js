/**
 * Simple script to create users using signup (no service role key needed)
 * This creates the demo user and talent user
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enyrffgedfvgunokpmqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser(email, password, userData, description) {
  console.log(`\n👤 Creating ${description}...`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: userData
      }
    });
    
    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`⚠️ User already exists, trying to sign in...`);
        
        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (signInError) {
          console.log(`❌ Sign in failed: ${signInError.message}`);
          return false;
        } else {
          console.log(`✅ Successfully signed in existing user!`);
          await supabase.auth.signOut();
          return true;
        }
      } else {
        console.log(`❌ Signup failed: ${error.message}`);
        return false;
      }
    } else {
      console.log(`✅ User created successfully!`);
      console.log(`👤 User ID: ${data.user?.id}`);
      console.log(`📧 User Email: ${data.user?.email}`);
      
      // Sign out after creation
      await supabase.auth.signOut();
      return true;
    }
  } catch (error) {
    console.log(`💥 Unexpected error: ${error.message}`);
    return false;
  }
}

async function createAllUsers() {
  console.log('🚀 Creating users for Temanly...\n');
  
  // Create demo user
  await createUser(
    'demo@temanly.com',
    'demo123',
    {
      user_type: 'client',
      name: 'Demo User'
    },
    'Demo User'
  );
  
  // Create talent user (Amanda/Yasmina)
  await createUser(
    'amandasoenoko@gmail.com',
    'TalentPass123!',
    {
      user_type: 'talent',
      name: 'Yasmina Toussignant'
    },
    'Talent User (Yasmina)'
  );
  
  // Test both logins
  console.log('\n🧪 Testing logins...');
  
  // Test demo login
  console.log('\n🧪 Testing demo login...');
  try {
    const { data: demoData, error: demoError } = await supabase.auth.signInWithPassword({
      email: 'demo@temanly.com',
      password: 'demo123'
    });
    
    if (demoError) {
      console.log(`❌ Demo login failed: ${demoError.message}`);
    } else {
      console.log(`✅ Demo login successful!`);
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log(`💥 Demo login error: ${error.message}`);
  }
  
  // Test talent login
  console.log('\n🧪 Testing talent login...');
  try {
    const { data: talentData, error: talentError } = await supabase.auth.signInWithPassword({
      email: 'amandasoenoko@gmail.com',
      password: 'TalentPass123!'
    });
    
    if (talentError) {
      console.log(`❌ Talent login failed: ${talentError.message}`);
    } else {
      console.log(`✅ Talent login successful!`);
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log(`💥 Talent login error: ${error.message}`);
  }
  
  console.log('\n🎉 All done! You can now login with:');
  console.log('\n📋 Demo Credentials:');
  console.log('📧 Email: demo@temanly.com');
  console.log('🔑 Password: demo123');
  console.log('\n📋 Talent Credentials:');
  console.log('📧 Email: amandasoenoko@gmail.com');
  console.log('🔑 Password: TalentPass123!');
}

// Run the script
createAllUsers();
