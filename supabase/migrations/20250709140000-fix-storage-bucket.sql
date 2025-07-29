-- Fix storage bucket and policies for verification documents

-- First, ensure the bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'verification-documents', 
  'verification-documents', 
  true, -- Make public so documents can be viewed
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access verification documents" ON storage.objects;

-- Create comprehensive storage policies

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload verification documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own verification documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update/replace their own documents
CREATE POLICY "Users can update their own verification documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own verification documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all verification documents
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

-- Allow admins to update all verification documents
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

-- Allow admins to delete all verification documents
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

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can access verification documents" ON storage.objects
FOR ALL 
TO service_role
USING (bucket_id = 'verification-documents');

-- Create function to get signed URLs for admin
CREATE OR REPLACE FUNCTION get_verification_document_url(file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Generate signed URL valid for 1 hour
  SELECT storage.create_signed_url('verification-documents', file_path, 3600) INTO signed_url;
  
  RETURN signed_url;
END;
$$;