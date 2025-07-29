// Browser Console Script to Fix Profile Images Bucket
// Copy and paste this entire script into your browser console while on the Temanly website

(async function fixProfileImagesBucket() {
  console.log('🚀 Starting profile images bucket fix...');
  
  // Check if we're on the right domain and have access to supabase
  if (typeof window === 'undefined' || !window.location.hostname.includes('temanly')) {
    console.error('❌ This script should be run on the Temanly website');
    return;
  }

  // Try to get supabase client from the global scope or import it
  let supabase;
  try {
    // Try to access supabase from the global scope (if available)
    if (window.supabase) {
      supabase = window.supabase;
    } else {
      // Import from the module if available
      const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
      supabase = createClient(
        'https://enyrffgedfvgunokpmqk.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueXJmZmdlZGZ2Z3Vub2twbXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMwMTIsImV4cCI6MjA2NTU0OTAxMn0.Wz--lkPdrmaT6nO7_JMRfC7oWJQqhajjcNNQThV1DD8'
      );
    }
  } catch (error) {
    console.error('❌ Could not access Supabase client:', error);
    console.log('💡 Make sure you are logged into the Temanly website');
    return;
  }

  try {
    console.log('🔍 Checking current bucket status...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const profileBucket = buckets?.find(bucket => bucket.id === 'profile-images');
    
    if (profileBucket) {
      console.log('✅ Profile images bucket already exists:', profileBucket);
      console.log('📊 Bucket configuration:', {
        id: profileBucket.id,
        name: profileBucket.name,
        public: profileBucket.public,
        file_size_limit: profileBucket.file_size_limit,
        allowed_mime_types: profileBucket.allowed_mime_types
      });
    } else {
      console.log('❌ Profile images bucket does not exist');
      console.log('💡 You need to run the SQL migration to create the bucket');
      console.log('📋 Copy and run this SQL in your Supabase SQL editor:');
      console.log(`
-- Create profile-images bucket
INSERT INTO storage.buckets (
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at,
    updated_at
) VALUES (
    'profile-images',
    'profile-images', 
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    updated_at = NOW();
      `);
    }

    // Test upload functionality
    console.log('🧪 Testing upload functionality...');
    
    // Create a small test file
    const testContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const response = await fetch(testContent);
    const blob = await response.blob();
    const testFile = new File([blob], 'test.png', { type: 'image/png' });
    
    const testPath = `profile-images/test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(testPath, testFile);

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
      console.log('💡 This confirms the bucket needs to be created');
    } else {
      console.log('✅ Upload test successful:', uploadData);
      
      // Clean up test file
      await supabase.storage.from('profile-images').remove([testPath]);
      console.log('🧹 Test file cleaned up');
    }

    console.log('🎯 Diagnosis complete!');
    console.log('📋 Next steps:');
    console.log('1. If bucket doesn\'t exist, run the SQL migration in Supabase dashboard');
    console.log('2. If bucket exists but upload fails, check RLS policies');
    console.log('3. Try uploading a profile picture again');

  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error);
  }
})();

// Instructions for manual fix
console.log(`
🔧 MANUAL FIX INSTRUCTIONS:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/enyrffgedfvgunokpmqk

2. Navigate to SQL Editor

3. Run this SQL query:

INSERT INTO storage.buckets (
    id, 
    name, 
    public, 
    file_size_limit, 
    allowed_mime_types,
    created_at,
    updated_at
) VALUES (
    'profile-images',
    'profile-images', 
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    updated_at = NOW();

4. Then run the storage policies:

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- Create new policies
CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-images');

5. Try uploading your profile picture again!
`);
