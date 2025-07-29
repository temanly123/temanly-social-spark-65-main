-- Simple storage bucket fix for verification documents
-- This will recreate the bucket with minimal configuration

-- Clean slate: remove bucket and recreate
DELETE FROM storage.objects WHERE bucket_id = 'verification-documents';
DELETE FROM storage.buckets WHERE id = 'verification-documents';

-- Create the bucket with basic settings only
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false);

-- Remove ALL existing policies first
DO $$ 
DECLARE
    pol_name text;
BEGIN
    -- Get all policy names for storage.objects that might conflict
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%verification%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol_name);
    END LOOP;
END $$;

-- Create minimal working policies
CREATE POLICY "allow_all_authenticated_verification" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "allow_all_service_role_verification" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- Also allow anon for testing
CREATE POLICY "allow_anon_verification" ON storage.objects
FOR ALL TO anon
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- Make sure the verification_documents table exists with simple structure
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple unique constraint
DROP INDEX IF EXISTS idx_verification_documents_user_type;
CREATE UNIQUE INDEX idx_verification_documents_user_type 
ON public.verification_documents (user_id, document_type);

-- Enable RLS with simple policies
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Clear existing policies
DROP POLICY IF EXISTS "allow_all_authenticated" ON public.verification_documents;
DROP POLICY IF EXISTS "allow_all_service_role" ON public.verification_documents;
DROP POLICY IF EXISTS "allow_anon_insert" ON public.verification_documents;

-- Create simple policies
CREATE POLICY "allow_all_authenticated" ON public.verification_documents
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_service_role" ON public.verification_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_anon_insert" ON public.verification_documents
FOR INSERT TO anon
WITH CHECK (true);

RAISE NOTICE 'Storage bucket recreated with minimal policies!';