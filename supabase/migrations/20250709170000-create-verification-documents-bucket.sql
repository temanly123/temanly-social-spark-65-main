
-- Complete setup for verification documents storage
-- This migration will create the bucket and all necessary policies

-- First, ensure we have the storage extension enabled
CREATE EXTENSION IF NOT EXISTS "storage-api";

-- Drop the bucket if it exists (to start fresh)
DELETE FROM storage.buckets WHERE id = 'verification-documents';

-- Create the verification-documents bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection, created_at, updated_at) 
VALUES (
  'verification-documents', 
  'verification-documents', 
  false, -- Keep private for security
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
  false,
  NOW(),
  NOW()
);

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all files" ON storage.objects;

-- Create comprehensive storage policies for verification-documents bucket

-- 1. Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload verification documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow users to view their own documents
CREATE POLICY "Users can view their own verification documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to update/replace their own documents
CREATE POLICY "Users can update their own verification documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to delete their own documents
CREATE POLICY "Users can delete their own verification documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Allow admins to view all verification documents
CREATE POLICY "Admins can view all verification documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- 6. Allow admins to update all verification documents
CREATE POLICY "Admins can update all verification documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- 7. Allow admins to delete all verification documents
CREATE POLICY "Admins can delete all verification documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- 8. Allow service role full access (for edge functions and backend operations)
CREATE POLICY "Service role can access verification documents" ON storage.objects
FOR ALL 
TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- 9. Allow anon role to insert (for public uploads if needed)
CREATE POLICY "Allow anon uploads to verification documents" ON storage.objects
FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'verification-documents');

-- Ensure verification_documents table exists with proper structure
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

-- Drop existing RLS policies for verification_documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Service role can access all documents" ON public.verification_documents;

-- Create RLS policies for verification_documents table
CREATE POLICY "Users can view their own documents" ON public.verification_documents
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own documents" ON public.verification_documents
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" ON public.verification_documents
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all documents" ON public.verification_documents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all documents" ON public.verification_documents
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Service role can access all documents" ON public.verification_documents
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_verification_documents_updated_at ON public.verification_documents;
CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for admin to get signed URLs
CREATE OR REPLACE FUNCTION admin_get_verification_document_url(document_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signed_url text;
  is_admin boolean := false;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Generate signed URL valid for 1 hour using the storage extension
  SELECT storage.create_signed_url('verification-documents', document_path, 3600) INTO signed_url;
  
  RETURN signed_url;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_verification_document_url(text) TO authenticated;

-- Create view for admin document management
CREATE OR REPLACE VIEW admin_verification_documents AS
SELECT 
  vd.id,
  vd.user_id,
  vd.document_type,
  vd.document_url,
  vd.status,
  vd.file_name,
  vd.file_size,
  vd.content_type,
  vd.admin_notes,
  vd.created_at,
  vd.updated_at,
  p.name as user_name,
  p.email as user_email,
  p.phone as user_phone,
  p.verification_status as user_verification_status,
  -- Check if file exists in storage
  EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'verification-documents' 
    AND name = vd.document_url
  ) as file_exists_in_storage
FROM verification_documents vd
LEFT JOIN profiles p ON vd.user_id = p.id
ORDER BY vd.created_at DESC;

-- Grant access to the view
GRANT SELECT ON admin_verification_documents TO authenticated;

-- Insert sample admin user if not exists (for testing)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@temanly.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, name, user_type, verification_status, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@temanly.com',
  'Admin Temanly',
  'admin',
  'verified',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Log successful setup
DO $$ 
BEGIN 
  RAISE NOTICE 'Verification documents storage setup completed successfully';
  RAISE NOTICE 'Bucket created: verification-documents';
  RAISE NOTICE 'Policies created: 9 storage policies';
  RAISE NOTICE 'Table created: verification_documents with RLS';
  RAISE NOTICE 'Admin functions created';
END $$;
