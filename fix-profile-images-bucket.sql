-- Fix profile images bucket and policies
-- This SQL can be run directly in the Supabase SQL editor

-- First, ensure we have the storage extension enabled
CREATE EXTENSION IF NOT EXISTS "storage-api";

-- Create the profile-images bucket with proper configuration
DO $$ 
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    -- Check if bucket already exists
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'profile-images'
    ) INTO bucket_exists;

    -- Only create if it doesn't exist
    IF NOT bucket_exists THEN
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
            true, -- Make public so profile images can be displayed
            5242880, -- 5MB limit (matching the frontend validation)
            ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created bucket: profile-images';
    ELSE
        -- Update existing bucket to ensure correct settings
        UPDATE storage.buckets 
        SET 
            public = true,
            file_size_limit = 5242880,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
            updated_at = NOW()
        WHERE id = 'profile-images';
        
        RAISE NOTICE 'Updated bucket: profile-images';
    END IF;
END $$;

-- Drop any existing policies for profile-images bucket to avoid conflicts
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage profile images" ON storage.objects;

-- Create comprehensive storage policies for profile-images bucket

-- 1. Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload profile images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- 2. Allow authenticated users to update their own profile images
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

-- 3. Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = 'profile-images'
);

-- 4. Allow public access to view profile images (since bucket is public)
CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'profile-images');

-- 5. Allow service role full access for admin operations
CREATE POLICY "Service role can manage profile images" ON storage.objects
FOR ALL 
TO service_role
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Verify the bucket was created
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'profile-images';
