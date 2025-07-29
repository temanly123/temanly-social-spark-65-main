-- Fix storage.objects table constraints for proper file uploads
-- This addresses the ON CONFLICT specification error

-- Add missing unique constraint on storage.objects table
-- This constraint is required by Supabase storage system
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'objects_bucketid_objname_version_key' 
        AND table_name = 'objects' 
        AND table_schema = 'storage'
    ) THEN
        -- Add the unique constraint that Supabase storage expects
        ALTER TABLE storage.objects 
        ADD CONSTRAINT objects_bucketid_objname_version_key 
        UNIQUE (bucket_id, name, version);
        
        RAISE NOTICE 'Added unique constraint to storage.objects';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on storage.objects';
    END IF;
END $$;

-- Ensure the bucket exists and is properly configured
DO $$ 
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    -- Check if bucket already exists
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets 
        WHERE id = 'verification-documents'
    ) INTO bucket_exists;

    -- Only create if it doesn't exist
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

-- Clean up and recreate storage policies with simpler approach
DROP POLICY IF EXISTS "allow_all_verification_documents_access" ON storage.objects;
DROP POLICY IF EXISTS "service_role_verification_documents" ON storage.objects;

-- Create simple and effective storage policies
CREATE POLICY "verification_documents_policy"
ON storage.objects FOR ALL 
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');