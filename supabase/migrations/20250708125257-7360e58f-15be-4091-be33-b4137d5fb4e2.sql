-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Create storage policies for verification documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own verification documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all verification documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'verification-documents' AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND user_type = 'admin'
));

-- Create function to handle document uploads
CREATE OR REPLACE FUNCTION handle_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        status
      ) VALUES (
        user_id_from_path,
        doc_type,
        NEW.name,
        'pending'
      )
      ON CONFLICT (user_id, document_type) 
      DO UPDATE SET 
        document_url = EXCLUDED.document_url,
        updated_at = now(),
        status = 'pending';
    END IF;
    
    RETURN NEW;
  END;
END;
$$;

-- Create trigger for document uploads
CREATE TRIGGER on_document_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'verification-documents')
  EXECUTE FUNCTION handle_document_upload();