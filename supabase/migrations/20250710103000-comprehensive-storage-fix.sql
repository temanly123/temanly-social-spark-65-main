-- Comprehensive storage fix for verification documents
-- This addresses all RLS and constraint issues

-- 1. Fix storage bucket policies and constraints
-- First ensure we can work with storage
SET statement_timeout = '60s';

-- 2. Clean up existing problematic policies
DO $$ 
DECLARE
    pol_name text;
BEGIN
    -- Remove all storage policies that might conflict
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename IN ('objects', 'buckets')
        AND policyname LIKE '%verification%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.%s', 
                      pol_name, 
                      CASE WHEN pol_name LIKE '%bucket%' THEN 'buckets' ELSE 'objects' END);
    END LOOP;
END $$;

-- 3. Create simple, working storage policies for objects
CREATE POLICY "verification_objects_all_authenticated" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "verification_objects_service_role" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- Also allow anon (for testing and uploads without auth)
CREATE POLICY "verification_objects_anon" ON storage.objects
FOR ALL TO anon
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- 4. Fix storage buckets table policies (this is what's causing the RLS error)
CREATE POLICY "buckets_all_service_role" ON storage.buckets
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "buckets_select_authenticated" ON storage.buckets
FOR SELECT TO authenticated
USING (true);

-- 5. Ensure the verification-documents bucket exists with proper settings
DO $$
DECLARE
    bucket_exists boolean;
BEGIN
    -- Check if bucket exists
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'verification-documents') INTO bucket_exists;
    
    IF NOT bucket_exists THEN
        -- Create bucket using service role privileges
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
        RAISE NOTICE 'Created verification-documents bucket';
    ELSE
        -- Update existing bucket with proper settings
        UPDATE storage.buckets 
        SET 
            file_size_limit = 10485760,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
            updated_at = NOW()
        WHERE id = 'verification-documents';
        RAISE NOTICE 'Updated verification-documents bucket settings';
    END IF;
END $$;

-- 6. Recreate verification_documents table with proper constraints
DROP TABLE IF EXISTS public.verification_documents CASCADE;

CREATE TABLE public.verification_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'profile_photo')),
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint properly
ALTER TABLE public.verification_documents 
ADD CONSTRAINT verification_documents_user_document_type_unique 
UNIQUE (user_id, document_type);

-- 7. Enable RLS and create policies
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_docs_all_authenticated" ON public.verification_documents
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "verification_docs_service_role" ON public.verification_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "verification_docs_anon_insert" ON public.verification_documents
FOR INSERT TO anon
WITH CHECK (true);

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.objects TO anon;

RAISE NOTICE 'Storage setup completed successfully! Test upload should now work.';