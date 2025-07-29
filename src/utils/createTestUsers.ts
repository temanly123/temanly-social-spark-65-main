import { supabase } from '@/integrations/supabase/client';

export const createTestUsers = async () => {
  console.log('🔧 Creating test users...');

  const testUsers = [
    {
      email: 'demo@temanly.com',
      password: 'demo123',
      name: 'Demo User',
      user_type: 'user'
    },
    {
      email: 'admin@temanly.com',
      password: 'admin123',
      name: 'Admin User',
      user_type: 'admin'
    },
    {
      email: 'talent@temanly.com',
      password: 'talent123',
      name: 'Talent User',
      user_type: 'companion'
    },
    {
      email: 'test@temanly.com',
      password: 'test123',
      name: 'Test User',
      user_type: 'user'
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // First try to sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            full_name: user.name,
            user_type: user.user_type
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`✅ User ${user.email} already exists`);
          continue;
        } else {
          console.error(`❌ Error creating user ${user.email}:`, authError);
          continue;
        }
      }

      if (authData.user) {
        console.log(`✅ User ${user.email} created successfully`);
        
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            name: user.name,
            email: user.email,
            user_type: user.user_type,
            verification_status: 'verified',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error(`❌ Error creating profile for ${user.email}:`, profileError);
        } else {
          console.log(`✅ Profile created for ${user.email}`);
        }
      }

    } catch (error) {
      console.error(`❌ Unexpected error creating user ${user.email}:`, error);
    }
  }

  console.log('🎉 Test user creation completed!');
};

// Function to reset a user's password (for testing)
export const resetUserPassword = async (email: string, newPassword: string) => {
  try {
    console.log(`🔄 Resetting password for ${email}`);
    
    // This would typically be done through admin API
    // For now, we'll just log the instruction
    console.log(`To reset password for ${email}:`);
    console.log(`1. Go to Supabase dashboard`);
    console.log(`2. Navigate to Authentication > Users`);
    console.log(`3. Find user ${email}`);
    console.log(`4. Click "Reset Password" or update password directly`);
    console.log(`5. Or use the password reset email functionality`);
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
};

// Function to list current users (for debugging)
export const listUsers = async () => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, email, user_type, verification_status, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    console.log('📋 Current users in database:');
    profiles?.forEach(profile => {
      console.log(`- ${profile.email} (${profile.user_type}) - ${profile.verification_status}`);
    });

    return profiles || [];
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
};
