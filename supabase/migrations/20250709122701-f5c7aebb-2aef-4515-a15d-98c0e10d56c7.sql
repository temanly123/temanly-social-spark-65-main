-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

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

-- Policy for admins to update verification documents
CREATE POLICY "Admins can update verification documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Policy for admins to delete verification documents
CREATE POLICY "Admins can delete verification documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Update verification_documents table to better track documents
ALTER TABLE public.verification_documents 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Create function to handle document upload metadata
CREATE OR REPLACE FUNCTION public.handle_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Extract user_id and document_type from the file path
  -- Expected path format: user_id/document_type
  DECLARE
    path_parts text[];
    user_id_from_path uuid;
    doc_type text;
  BEGIN
    path_parts := string_to_array(NEW.name, '/');
    
    IF array_length(path_parts, 1) >= 2 THEN
      user_id_from_path := path_parts[1]::uuid;
      doc_type := split_part(path_parts[2], '.', 1); -- Remove file extension
      
      -- Insert into verification_documents table
      INSERT INTO verification_documents (
        user_id,
        document_type,
        document_url,
        status,
        file_name,
        file_size,
        content_type
      ) VALUES (
        user_id_from_path,
        doc_type,
        NEW.name,
        'pending',
        NEW.name,
        NEW.metadata->>'size',
        NEW.metadata->>'mimetype'
      )
      ON CONFLICT (user_id, document_type) 
      DO UPDATE SET 
        document_url = EXCLUDED.document_url,
        updated_at = now(),
        status = 'pending',
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        content_type = EXCLUDED.content_type;
    END IF;
    
    RETURN NEW;
  END;
END;
$function$;

-- Create trigger for document upload
DROP TRIGGER IF EXISTS on_document_upload ON storage.objects;
CREATE TRIGGER on_document_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'verification-documents')
  EXECUTE FUNCTION public.handle_document_upload();