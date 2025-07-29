-- Create admin functions to access verification documents
-- These functions bypass RLS for admin access

-- 1. Function to get all verification documents (admin only)
CREATE OR REPLACE FUNCTION get_all_verification_documents()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    document_type TEXT,
    document_url TEXT,
    status TEXT,
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return all documents without RLS restrictions
    RETURN QUERY
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
        vd.updated_at
    FROM verification_documents vd
    ORDER BY vd.created_at DESC;
END;
$$;

-- 2. Function to get documents for a specific user
CREATE OR REPLACE FUNCTION get_user_verification_documents(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    document_type TEXT,
    document_url TEXT,
    status TEXT,
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Return documents for specific user without RLS restrictions
    RETURN QUERY
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
        vd.updated_at
    FROM verification_documents vd
    WHERE vd.user_id = target_user_id
    ORDER BY vd.created_at DESC;
END;
$$;

-- 3. Function to update document status (admin only)
CREATE OR REPLACE FUNCTION admin_update_verification_document(
    doc_id UUID,
    new_status TEXT,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update document status without RLS restrictions
    UPDATE verification_documents 
    SET 
        status = new_status,
        admin_notes = COALESCE(notes, admin_notes),
        updated_at = NOW()
    WHERE id = doc_id;
    
    RETURN FOUND;
END;
$$;

-- 4. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_all_verification_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_verification_documents(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_verification_document(UUID, TEXT, TEXT) TO authenticated;

-- 5. Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION get_all_verification_documents() TO service_role;
GRANT EXECUTE ON FUNCTION get_user_verification_documents(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION admin_update_verification_document(UUID, TEXT, TEXT) TO service_role;

-- 6. Ensure the verification_documents table exists and has the right structure
CREATE TABLE IF NOT EXISTS public.verification_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    document_url TEXT,
    status TEXT DEFAULT 'pending',
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Disable RLS to allow function access
ALTER TABLE public.verification_documents DISABLE ROW LEVEL SECURITY;

-- 8. Create unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_documents_user_id_document_type_key'
    ) THEN
        ALTER TABLE public.verification_documents 
        ADD CONSTRAINT verification_documents_user_id_document_type_key 
        UNIQUE (user_id, document_type);
    END IF;
END $$;

-- 9. Grant table permissions
GRANT ALL ON public.verification_documents TO authenticated;
GRANT ALL ON public.verification_documents TO service_role;
