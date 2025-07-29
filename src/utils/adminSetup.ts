
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async (email: string, password: string, name: string) => {
  try {
    // Create admin user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating admin auth:', authError);
      return { success: false, error: authError.message };
    }

    if (authData.user) {
      // Create admin profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          user_type: 'admin',
          verification_status: 'verified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        return { success: false, error: profileError.message };
      }

      console.log('Admin user created successfully');
      return {
        success: true,
        message: 'Admin user created successfully',
        userId: authData.user.id
      };
    }

    return { success: false, error: 'Failed to create admin user' };
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

/**
 * Creates auth users for existing profile users who don't have auth accounts
 * This fixes the issue where users exist in profiles but can't login
 */
export const createMissingAuthUsers = async () => {
  try {
    console.log('🔍 Checking for users without auth accounts...');

    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, user_type, phone')
      .neq('user_type', 'admin'); // Skip admin users

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return { success: false, error: profileError.message };
    }

    if (!profiles || profiles.length === 0) {
      return { success: true, message: 'No profiles found' };
    }

    console.log(`📊 Found ${profiles.length} profiles to check`);

    const results = [];
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Check if auth user already exists
        const { data: existingAuth } = await supabase.auth.admin.getUserById(profile.id);

        if (existingAuth.user) {
          console.log(`⏭️ Auth user already exists for ${profile.email}`);
          skipped++;
          continue;
        }

        // Create auth user with a default password
        const defaultPassword = 'TempPassword123!';
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: profile.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: {
            name: profile.name,
            user_type: profile.user_type,
            phone: profile.phone
          }
        });

        if (authError) {
          console.error(`❌ Error creating auth for ${profile.email}:`, authError);
          errors++;
          results.push({
            email: profile.email,
            success: false,
            error: authError.message
          });
          continue;
        }

        if (authData.user) {
          // Update the profile with the correct auth user ID if needed
          if (authData.user.id !== profile.id) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ id: authData.user.id })
              .eq('id', profile.id);

            if (updateError) {
              console.error(`⚠️ Warning: Could not update profile ID for ${profile.email}:`, updateError);
            }
          }

          console.log(`✅ Created auth user for ${profile.email} with password: ${defaultPassword}`);
          created++;
          results.push({
            email: profile.email,
            success: true,
            password: defaultPassword,
            userId: authData.user.id
          });
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`❌ Unexpected error for ${profile.email}:`, error);
        errors++;
        results.push({
          email: profile.email,
          success: false,
          error: error.message
        });
      }
    }

    const summary = {
      success: true,
      message: `Processed ${profiles.length} profiles: ${created} created, ${skipped} skipped, ${errors} errors`,
      stats: { total: profiles.length, created, skipped, errors },
      results
    };

    console.log('📋 Summary:', summary.message);
    return summary;

  } catch (error: any) {
    console.error('Error in createMissingAuthUsers:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Creates a single auth user for a specific email if they exist in profiles but not in auth
 */
export const createAuthUserForEmail = async (email: string, password: string = 'TempPassword123!') => {
  try {
    console.log(`🔍 Creating auth user for ${email}...`);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Profile not found for this email' };
    }

    // Check if auth user already exists by email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === email);

    if (existingUser) {
      return { success: false, error: 'Auth user already exists for this email' };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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
      // Update profile with correct auth user ID if needed
      if (authData.user.id !== profile.id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ id: authData.user.id })
          .eq('id', profile.id);

        if (updateError) {
          console.warn(`⚠️ Could not update profile ID for ${email}:`, updateError);
        }
      }

      console.log(`✅ Successfully created auth user for ${email}`);
      return {
        success: true,
        message: `Auth user created for ${email}`,
        userId: authData.user.id,
        password: password
      };
    }

    return { success: false, error: 'No user data returned from auth creation' };

  } catch (error: any) {
    console.error(`Error creating auth user for ${email}:`, error);
    return { success: false, error: error.message };
  }
};

export const checkAdminExists = async (email: string) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', email)
      .eq('user_type', 'admin')
      .single();

    return { exists: !!profile, profile };
  } catch (error) {
    console.error('Error checking admin:', error);
    return { exists: false, profile: null };
  }
};
