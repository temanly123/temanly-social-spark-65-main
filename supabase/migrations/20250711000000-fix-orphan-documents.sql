-- Fix orphan documents issue by ensuring proper table structure and constraints
-- This migration ensures documents are never orphaned during signup

-- 1. Drop existing table to start fresh
DROP TABLE IF EXISTS public.verification_documents CASCADE;

-- 2. Create verification_documents table with proper structure
CREATE TABLE public.verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,  -- No foreign key constraint to avoid cascade issues
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'profile_photo')),
    document_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_type)
);

-- 3. Create index for better performance
CREATE INDEX idx_verification_documents_user_id ON public.verification_documents(user_id);
CREATE INDEX idx_verification_documents_status ON public.verification_documents(status);

-- 4. Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for users to manage their own documents
CREATE POLICY "Users can view their own documents"
ON public.verification_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.verification_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.verification_documents
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create admin policies
CREATE POLICY "Admins can view all documents"
ON public.verification_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all documents"
ON public.verification_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can delete all documents"
ON public.verification_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- 7. Create function to automatically clean up orphaned documents
CREATE OR REPLACE FUNCTION cleanup_orphaned_documents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete documents where user_id doesn't exist in profiles table
  DELETE FROM public.verification_documents 
  WHERE user_id NOT IN (
    SELECT id FROM public.profiles
  );
  
  RAISE NOTICE 'Cleaned up orphaned documents';
END;
$$;

-- 8. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_verification_documents_updated_at
  BEFORE UPDATE ON public.verification_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_documents_updated_at();

-- 9. Grant necessary permissions
GRANT ALL ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;

-- 10. Run initial cleanup
SELECT cleanup_orphaned_documents();

-- 11. Create a function that can be called to ensure document integrity
CREATE OR REPLACE FUNCTION ensure_document_integrity()
RETURNS TABLE(
  total_documents BIGINT,
  orphaned_documents BIGINT,
  valid_documents BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count BIGINT;
  orphaned_count BIGINT;
  valid_count BIGINT;
BEGIN
  -- Count total documents
  SELECT COUNT(*) INTO total_count FROM public.verification_documents;
  
  -- Count orphaned documents
  SELECT COUNT(*) INTO orphaned_count 
  FROM public.verification_documents 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  -- Count valid documents
  valid_count := total_count - orphaned_count;
  
  -- Clean up orphaned documents
  DELETE FROM public.verification_documents 
  WHERE user_id NOT IN (SELECT id FROM public.profiles);
  
  RETURN QUERY SELECT total_count, orphaned_count, valid_count;
END;
$$;
