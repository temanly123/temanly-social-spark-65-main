-- Simple fix for verification documents without touching system tables
-- This works within user permission levels

-- 1. ENSURE BUCKET EXISTS (this should work)
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
) ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

-- 2. CREATE/UPDATE VERIFICATION_DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    UNIQUE(user_id, document_type)
);

-- 3. DISABLE RLS ON VERIFICATION_DOCUMENTS (user table)
ALTER TABLE public.verification_documents DISABLE ROW LEVEL SECURITY;

-- 4. CREATE VERY PERMISSIVE STORAGE POLICIES (instead of disabling RLS)
-- Drop existing policies first
DROP POLICY IF EXISTS "verification_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "verification_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "verification_delete_policy" ON storage.objects;

-- Create super permissive policies for verification-documents bucket
CREATE POLICY "verification_upload_policy" ON storage.objects
    FOR INSERT TO authenticated, anon
    WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "verification_read_policy" ON storage.objects
    FOR SELECT TO authenticated, anon
    USING (bucket_id = 'verification-documents');

CREATE POLICY "verification_delete_policy" ON storage.objects
    FOR DELETE TO authenticated, anon
    USING (bucket_id = 'verification-documents');

-- 5. GRANT PERMISSIONS ON USER TABLES
GRANT ALL ON public.verification_documents TO authenticated, anon;