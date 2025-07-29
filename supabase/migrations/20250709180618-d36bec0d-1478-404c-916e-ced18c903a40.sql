-- Fix storage bucket creation for verification documents
-- This migration ensures the bucket is created properly

-- Enable storage extension
CREATE EXTENSION IF NOT EXISTS "storage";

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

-- Allow anon role for testing upload functionality
CREATE POLICY "anon_upload_verification_documents"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'verification-documents');

-- Ensure verification_documents table exists
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'profile_photo')),
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_type)
);

-- Enable RLS on verification_documents table
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for verification_documents table
DROP POLICY IF EXISTS "verify_docs_user_select" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_user_insert" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_user_update" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_admin_all" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_service_all" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_anon_insert" ON public.verification_documents;

CREATE POLICY "verify_docs_user_select" ON public.verification_documents
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "verify_docs_user_insert" ON public.verification_documents
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "verify_docs_user_update" ON public.verification_documents
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "verify_docs_admin_all" ON public.verification_documents
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type = 'admin'
    )
);

CREATE POLICY "verify_docs_service_all" ON public.verification_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow anon access for testing
CREATE POLICY "verify_docs_anon_insert" ON public.verification_documents
FOR INSERT TO anon
WITH CHECK (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_verification_documents_updated_at ON public.verification_documents;
CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();