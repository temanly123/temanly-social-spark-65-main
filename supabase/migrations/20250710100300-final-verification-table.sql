-- Final storage bucket fix - using client-side creation approach
-- This migration focuses only on the database table and basic setup

-- Ensure the verification_documents table exists with proper structure
DROP TABLE IF EXISTS public.verification_documents CASCADE;

CREATE TABLE public.verification_documents (
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

-- Create a simple unique index
CREATE UNIQUE INDEX idx_verification_documents_unique 
ON public.verification_documents (user_id, document_type);

-- Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Create very simple policies
CREATE POLICY "enable_all_for_authenticated" ON public.verification_documents
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "enable_all_for_service_role" ON public.verification_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "enable_insert_for_anon" ON public.verification_documents
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

CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: The storage bucket will be created via the admin interface
-- using the "Create Bucket" button in the Storage Diagnostic Tool

RAISE NOTICE 'Database table ready. Use admin interface to create storage bucket.';