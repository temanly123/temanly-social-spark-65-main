/**
 * Quick fix script to create auth user for existing profile users
 * This script helps fix the login issue where users exist in profiles but not in auth
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://enyrffgedfvgunokpmqk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8";

// You need to set this as an environment variable or replace with your service role key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key-here";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAuthUserForEmail(email, password = 'TempPassword123!') {
  try {
    console.log(`🔍 Creating auth user for ${email}...`);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not found for this email:', profileError?.message);
      return { success: false, error: 'Profile not found for this email' };
    }

    console.log('✅ Found profile:', profile.name, profile.user_type);

    // Check if auth user already exists by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('⚠️ Auth user already exists for this email');
      return { success: false, error: 'Auth user already exists for this email' };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: profile.name,
        user_type: profile.user_type,
        phone: profile.phone
      }
    });

    if (authError) {
      console.error(`❌ Error creating auth for ${email}:`, authError);
      return { success: false, error: authError.message };
    }

    if (authData.user) {
      console.log(`✅ Successfully created auth user for ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log(`👤 User ID: ${authData.user.id}`);
      
      return {
        success: true,
        message: `Auth user created for ${email}`,
        userId: authData.user.id,
        password: password
      };
    }

    return { success: false, error: 'No user data returned from auth creation' };

  } catch (error) {
    console.error(`❌ Error creating auth user for ${email}:`, error);
    return { success: false, error: error.message };
  }
}

async function fixAllUsers() {
  try {
    console.log('🔍 Checking for users without auth accounts...');

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, user_type, phone')
      .neq('user_type', 'admin'); // Skip admin users

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('ℹ️ No profiles found');
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles to check`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Check if auth user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users?.find(u => u.email === profile.email);
        
        if (existingUser) {
          console.log(`⏭️ Auth user already exists for ${profile.email}`);
          skipped++;
          continue;
        }

        // Create auth user with a default password
        const defaultPassword = 'TempPassword123!';
        const result = await createAuthUserForEmail(profile.email, defaultPassword);
        
        if (result.success) {
          created++;
          console.log(`✅ Created: ${profile.email} | Password: ${defaultPassword}`);
        } else {
          errors++;
          console.log(`❌ Failed: ${profile.email} | Error: ${result.error}`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Unexpected error for ${profile.email}:`, error);
        errors++;
      }
    }

    console.log('\n📋 Summary:');
    console.log(`Total profiles: ${profiles.length}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Error in fixAllUsers:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node fix-user-auth.js <email> [password]  - Fix specific user');
    console.log('  node fix-user-auth.js --all               - Fix all users');
    console.log('');
    console.log('Examples:');
    console.log('  node fix-user-auth.js amandaangelasoenoko@gmail.com');
    console.log('  node fix-user-auth.js amandaangelasoenoko@gmail.com MyPassword123');
    console.log('  node fix-user-auth.js --all');
    return;
  }

  if (args[0] === '--all') {
    await fixAllUsers();
  } else {
    const email = args[0];
    const password = args[1] || 'TempPassword123!';
    
    console.log(`🚀 Creating auth user for: ${email}`);
    const result = await createAuthUserForEmail(email, password);
    
    if (result.success) {
      console.log('\n✅ Success!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${result.password}`);
      console.log(`User ID: ${result.userId}`);
      console.log('\nThe user can now login with these credentials.');
    } else {
      console.log('\n❌ Failed!');
      console.log(`Error: ${result.error}`);
    }
  }
}

// Check if this is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { createAuthUserForEmail, fixAllUsers };
