-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete verification documents" ON storage.objects;

-- Create storage policies for verification documents
-- Policy for authenticated users to upload their own documents
CREATE POLICY "Users can upload verification documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to view their own documents
CREATE POLICY "Users can view their own verification documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for admins to view all verification documents
CREATE POLICY "Admins can view all verification documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Policy for service role (for admin functions)
CREATE POLICY "Service role can access verification documents" ON storage.objects
FOR ALL USING (auth.role() = 'service_role' AND bucket_id = 'verification-documents');

-- Update verification_documents table to better track documents
ALTER TABLE public.verification_documents 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS content_type TEXT;