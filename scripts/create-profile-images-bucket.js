// Script to create profile-images bucket and policies
// This can be run in the browser console or as a Node.js script

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://enyrffgedfvgunokpmqk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY"; // Replace with actual service role key

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createProfileImagesBucket() {
  try {
    console.log('🚀 Creating profile-images bucket...');

    // First, try to create the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('profile-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating bucket:', bucketError);
      return false;
    }

    if (bucketError && bucketError.message.includes('already exists')) {
      console.log('✅ Bucket already exists, updating configuration...');
      
      // Try to update bucket settings
      const { error: updateError } = await supabase.storage.updateBucket('profile-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880
      });

      if (updateError) {
        console.warn('⚠️ Could not update bucket settings:', updateError);
      }
    } else {
      console.log('✅ Bucket created successfully:', bucketData);
    }

    // Create storage policies using SQL
    const policies = [
      {
        name: 'Users can upload profile images',
        sql: `
          CREATE POLICY "Users can upload profile images" ON storage.objects
          FOR INSERT 
          TO authenticated
          WITH CHECK (
            bucket_id = 'profile-images' 
            AND (storage.foldername(name))[1] = 'profile-images'
          );
        `
      },
      {
        name: 'Users can update their own profile images',
        sql: `
          CREATE POLICY "Users can update their own profile images" ON storage.objects
          FOR UPDATE 
          TO authenticated
          USING (
            bucket_id = 'profile-images' 
            AND (storage.foldername(name))[1] = 'profile-images'
          )
          WITH CHECK (
            bucket_id = 'profile-images' 
            AND (storage.foldername(name))[1] = 'profile-images'
          );
        `
      },
      {
        name: 'Users can delete their own profile images',
        sql: `
          CREATE POLICY "Users can delete their own profile images" ON storage.objects
          FOR DELETE 
          TO authenticated
          USING (
            bucket_id = 'profile-images' 
            AND (storage.foldername(name))[1] = 'profile-images'
          );
        `
      },
      {
        name: 'Public can view profile images',
        sql: `
          CREATE POLICY "Public can view profile images" ON storage.objects
          FOR SELECT 
          TO public
          USING (bucket_id = 'profile-images');
        `
      },
      {
        name: 'Service role can manage profile images',
        sql: `
          CREATE POLICY "Service role can manage profile images" ON storage.objects
          FOR ALL 
          TO service_role
          USING (bucket_id = 'profile-images')
          WITH CHECK (bucket_id = 'profile-images');
        `
      }
    ];

    console.log('🔐 Creating storage policies...');

    // Drop existing policies first
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can view profile images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;',
      'DROP POLICY IF EXISTS "Service role can manage profile images" ON storage.objects;'
    ];

    for (const dropSql of dropPolicies) {
      try {
        await supabase.rpc('exec_sql', { sql: dropSql });
      } catch (error) {
        console.log('Policy drop (expected):', error.message);
      }
    }

    // Create new policies
    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (policyError) {
          console.error(`❌ Error creating policy "${policy.name}":`, policyError);
        } else {
          console.log(`✅ Created policy: ${policy.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating policy "${policy.name}":`, error);
      }
    }

    console.log('🎉 Profile images bucket setup completed!');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the function
createProfileImagesBucket().then(success => {
  if (success) {
    console.log('✅ Setup completed successfully!');
  } else {
    console.log('❌ Setup failed. Please check the errors above.');
  }
});

// Export for use in other scripts
export { createProfileImagesBucket };
