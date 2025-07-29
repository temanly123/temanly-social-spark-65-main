-- Fix verification_documents table constraints
-- This migration will properly set up the unique constraint

-- First, let's check if the table exists and recreate it properly
DROP TABLE IF EXISTS public.verification_documents CASCADE;

-- Create the table with proper constraints
CREATE TABLE public.verification_documents (
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the unique constraint properly
ALTER TABLE public.verification_documents 
ADD CONSTRAINT verification_documents_user_document_unique 
UNIQUE (user_id, document_type);

-- Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Create simple policies
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

CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE 'Verification documents table recreated with proper constraints!';