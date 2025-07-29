-- Fix document status consistency
-- This migration ensures the verification_documents table uses consistent status values

-- 1. First, let's check what status values currently exist
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Update any 'verified' status to 'approved' for consistency
    UPDATE public.verification_documents 
    SET status = 'approved' 
    WHERE status = 'verified';
    
    RAISE NOTICE 'Updated verified status to approved';
END $$;

-- 2. Ensure the table has the correct structure and constraints
ALTER TABLE public.verification_documents 
DROP CONSTRAINT IF EXISTS verification_documents_status_check;

-- 3. Add the correct status constraint
ALTER TABLE public.verification_documents 
ADD CONSTRAINT verification_documents_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_verification_documents_status 
ON public.verification_documents(status);

-- 5. Create function to update document status with proper validation
CREATE OR REPLACE FUNCTION admin_update_document_status_v2(
    doc_id UUID,
    new_status TEXT,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id_val UUID;
    approved_count INTEGER;
BEGIN
    -- Validate status
    IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Invalid status: %', new_status;
    END IF;
    
    -- Update document status
    UPDATE public.verification_documents 
    SET 
        status = new_status,
        admin_notes = COALESCE(notes, admin_notes),
        updated_at = NOW()
    WHERE id = doc_id
    RETURNING user_id INTO user_id_val;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- If document is approved, check if user should be verified
    IF new_status = 'approved' THEN
        SELECT COUNT(*) INTO approved_count
        FROM public.verification_documents 
        WHERE user_id = user_id_val 
        AND status = 'approved';
        
        -- If user has 2 or more approved documents, mark as verified
        IF approved_count >= 2 THEN
            UPDATE public.profiles 
            SET 
                verification_status = 'verified',
                status = 'active',
                updated_at = NOW()
            WHERE id = user_id_val;
        END IF;
    END IF;
    
    -- If document is rejected, set user verification to pending
    IF new_status = 'rejected' THEN
        UPDATE public.profiles 
        SET 
            verification_status = 'pending',
            updated_at = NOW()
        WHERE id = user_id_val;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION admin_update_document_status_v2(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_document_status_v2(UUID, TEXT, TEXT) TO service_role;

RAISE NOTICE 'Document status consistency fixed - using approved/rejected instead of verified/rejected';
