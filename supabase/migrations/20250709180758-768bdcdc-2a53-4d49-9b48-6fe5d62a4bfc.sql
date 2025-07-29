-- Fix storage bucket creation for verification documents
-- This migration ensures the bucket is created properly

-- Use DO block to handle bucket creation safely
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
            allowed_mime_types,
            created_at,
            updated_at
        ) VALUES (
            'verification-documents',
            'verification-documents', 
            false,
            10485760, -- 10MB
            ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created bucket: verification-documents';
    ELSE
        RAISE NOTICE 'Bucket verification-documents already exists';
    END IF;
END $$;

-- Remove all existing storage policies for this bucket
DROP POLICY IF EXISTS "authenticated_upload_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_read_all_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_all_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_all_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "service_role_all_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "anon_upload_verification_documents" ON storage.objects;

-- Create simple and effective storage policies
CREATE POLICY "authenticated_upload_verification_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "authenticated_read_verification_documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "authenticated_update_verification_documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "authenticated_delete_verification_documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verification-documents');

-- Admin policies
CREATE POLICY "admin_read_all_verification_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'verification-documents' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'admin'
    )
);

CREATE POLICY "admin_update_all_verification_documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'verification-documents' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'admin'
    )
);

CREATE POLICY "admin_delete_all_verification_documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'verification-documents' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'admin'
    )
);

-- Service role access (for backend functions)
CREATE POLICY "service_role_all_verification_documents"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');