-- Fix storage bucket and policies without modifying storage schema tables
-- Focus on ensuring proper bucket setup and policies

-- Clean up all existing storage policies first
DROP POLICY IF EXISTS "allow_all_verification_documents_access" ON storage.objects;
DROP POLICY IF EXISTS "service_role_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "verification_documents_policy" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_read_all_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_all_verification_documents" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_all_verification_documents" ON storage.objects;

-- Create very simple and permissive policies to ensure uploads work
CREATE POLICY "Allow authenticated uploads to verification-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "Allow authenticated access to verification-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "Allow authenticated updates to verification-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "Allow authenticated deletes from verification-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verification-documents');

-- Allow service role full access
CREATE POLICY "Allow service role full access to verification-documents"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'verification-documents')
WITH CHECK (bucket_id = 'verification-documents');

-- Ensure bucket policies allow access
DROP POLICY IF EXISTS "allow_authenticated_bucket_access" ON storage.buckets;
DROP POLICY IF EXISTS "allow_service_role_bucket_access" ON storage.buckets;

CREATE POLICY "Allow authenticated bucket access"
ON storage.buckets FOR SELECT TO authenticated
USING (id = 'verification-documents');

CREATE POLICY "Allow service role bucket access"
ON storage.buckets FOR ALL TO service_role
USING (true);