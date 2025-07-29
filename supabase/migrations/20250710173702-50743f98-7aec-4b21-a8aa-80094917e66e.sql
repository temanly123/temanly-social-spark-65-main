-- Fix storage bucket RLS policies and create verification-documents bucket

-- First, ensure proper RLS policies on storage.buckets table
DROP POLICY IF EXISTS "authenticated_can_create_buckets" ON storage.buckets;
DROP POLICY IF EXISTS "service_role_can_manage_buckets" ON storage.buckets;
DROP POLICY IF EXISTS "allow_authenticated_bucket_access" ON storage.buckets;
DROP POLICY IF EXISTS "allow_service_role_bucket_access" ON storage.buckets;

-- Create permissive policies for bucket management
CREATE POLICY "authenticated_can_manage_buckets"
ON storage.buckets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "service_role_can_manage_buckets"
ON storage.buckets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create the verification-documents bucket if it doesn't exist
DO $$ 
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'verification-documents'
    ) INTO bucket_exists;

    IF NOT bucket_exists THEN
        INSERT INTO storage.buckets (
            id, 
            name, 
            public, 
            file_size_limit, 
            allowed_mime_types
        ) VALUES (
            'verification-documents',
            'verification-documents', 
            false,
            10485760, -- 10MB
            ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
        );
        
        RAISE NOTICE 'Created bucket: verification-documents';
    ELSE
        RAISE NOTICE 'Bucket verification-documents already exists';
    END IF;
END $$;

-- Ensure proper policies on storage.objects for verification-documents bucket
DROP POLICY IF EXISTS "authenticated_can_upload_verification_docs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_can_view_verification_docs" ON storage.objects;
DROP POLICY IF EXISTS "admin_can_access_all_verification_docs" ON storage.objects;
DROP POLICY IF EXISTS "service_role_can_manage_verification_docs" ON storage.objects;

-- Create comprehensive policies for storage.objects
CREATE POLICY "authenticated_can_upload_verification_docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "users_can_view_own_verification_docs" 
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "admin_can_access_all_verification_docs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "service_role_can_manage_verification_docs"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');