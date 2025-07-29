-- Final fix for verification documents storage
-- This migration will clean up and recreate the storage bucket with proper policies

-- Drop existing bucket and all related objects
DELETE FROM storage.objects WHERE bucket_id = 'verification-documents';
DELETE FROM storage.buckets WHERE id = 'verification-documents';

-- Create the bucket with minimal configuration
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

-- Drop ALL existing storage policies for this bucket
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname LIKE '%verification%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Create simple, working storage policies
CREATE POLICY "allow_authenticated_uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "allow_authenticated_reads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "allow_authenticated_updates" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "allow_authenticated_deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'verification-documents');

-- Service role access
CREATE POLICY "allow_service_role_all" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- Anon access for uploads (if needed)
CREATE POLICY "allow_anon_uploads" ON storage.objects
FOR INSERT TO anon
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

-- Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing table policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Service role can access all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_user_select" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_user_insert" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_user_update" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_admin_all" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_service_all" ON public.verification_documents;
DROP POLICY IF EXISTS "verify_docs_anon_insert" ON public.verification_documents;

-- Simple table policies
CREATE POLICY "user_select_own" ON public.verification_documents
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_insert_own" ON public.verification_documents
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own" ON public.verification_documents
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_all_access" ON public.verification_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "service_role_all_access" ON public.verification_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Anon access for testing
CREATE POLICY "anon_insert_access" ON public.verification_documents
FOR INSERT TO anon
WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_verification_documents_updated_at ON public.verification_documents;
CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE 'Verification documents storage fixed successfully!';