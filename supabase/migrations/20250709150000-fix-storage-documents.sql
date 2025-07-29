-- Complete fix for verification documents storage issues
-- This migration will resolve all document storage problems

-- First, drop existing bucket if it has wrong configuration
DELETE FROM storage.buckets WHERE id = 'verification-documents';

-- Create bucket with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'verification-documents', 
  'verification-documents', 
  false, -- Keep private for security
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
);

-- Drop all existing storage policies to start fresh
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

-- Create comprehensive storage policies

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload verification documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own verification documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update/replace their own documents
CREATE POLICY "Users can update their own verification documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own verification documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
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

-- Fix verification_documents table path format
-- Update existing records to use correct path format
UPDATE verification_documents 
SET document_url = CASE 
  WHEN document_url NOT LIKE '%/%' THEN user_id || '/' || document_type || '.jpg'
  ELSE document_url
END
WHERE document_url IS NOT NULL;

-- Create function to fix orphaned documents
CREATE OR REPLACE FUNCTION fix_orphaned_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doc_record record;
  file_exists boolean;
BEGIN
  -- Check each document record and verify file exists
  FOR doc_record IN 
    SELECT * FROM verification_documents 
    WHERE document_url IS NOT NULL
  LOOP
    -- Try to check if file exists in storage
    SELECT EXISTS (
      SELECT 1 FROM storage.objects 
      WHERE bucket_id = 'verification-documents' 
      AND name = doc_record.document_url
    ) INTO file_exists;
    
    -- If file doesn't exist, try common path variations
    IF NOT file_exists THEN
      DECLARE
        possible_paths text[] := ARRAY[
          doc_record.user_id || '/' || doc_record.document_type || '.jpg',
          doc_record.user_id || '/' || doc_record.document_type || '.png',
          doc_record.user_id || '/' || doc_record.document_type || '.jpeg'
        ];
        path text;
        found_path text := NULL;
      BEGIN
        FOREACH path IN ARRAY possible_paths
        LOOP
          SELECT EXISTS (
            SELECT 1 FROM storage.objects 
            WHERE bucket_id = 'verification-documents' 
            AND name = path
          ) INTO file_exists;
          
          IF file_exists THEN
            found_path := path;
            EXIT;
          END IF;
        END LOOP;
        
        -- Update the document_url if we found the correct path
        IF found_path IS NOT NULL THEN
          UPDATE verification_documents 
          SET document_url = found_path 
          WHERE id = doc_record.id;
        END IF;
      END;
    END IF;
  END LOOP;
END;
$$;

-- Run the fix function
SELECT fix_orphaned_documents();

-- Create trigger to ensure consistent document paths
CREATE OR REPLACE FUNCTION ensure_document_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure document_url follows the pattern: user_id/document_type.extension
  IF NEW.document_url IS NOT NULL AND NEW.document_url NOT LIKE '%/%' THEN
    NEW.document_url := NEW.user_id || '/' || NEW.document_type || '.jpg';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_ensure_document_path ON verification_documents;

-- Create the trigger
CREATE TRIGGER trigger_ensure_document_path
  BEFORE INSERT OR UPDATE ON verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION ensure_document_path();

-- Create a view for admin document management
CREATE OR REPLACE VIEW admin_document_management AS
SELECT 
  vd.id,
  vd.user_id,
  vd.document_type,
  vd.document_url,
  vd.status,
  vd.file_name,
  vd.file_size,
  vd.content_type,
  vd.created_at,
  vd.updated_at,
  p.name as user_name,
  p.email as user_email,
  p.phone as user_phone,
  p.verification_status as user_verification_status,
  -- Check if file actually exists in storage
  EXISTS (
    SELECT 1 FROM storage.objects 
    WHERE bucket_id = 'verification-documents' 
    AND name = vd.document_url
  ) as file_exists_in_storage
FROM verification_documents vd
LEFT JOIN profiles p ON vd.user_id = p.id
ORDER BY vd.created_at DESC;

-- Grant permissions
GRANT SELECT ON admin_document_management TO authenticated;
GRANT EXECUTE ON FUNCTION fix_orphaned_documents() TO authenticated;