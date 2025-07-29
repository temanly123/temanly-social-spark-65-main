
-- Ensure verification_documents table is properly set up for database-only storage
-- This migration ensures the table exists and works correctly

-- Drop and recreate table to ensure clean state
DROP TABLE IF EXISTS public.verification_documents CASCADE;

CREATE TABLE public.verification_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'profile_photo')),
    document_url TEXT NOT NULL, -- Will store base64 data directly
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, document_type)
);

-- Enable RLS
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

-- Clear any existing policies
DROP POLICY IF EXISTS "user_select_own" ON public.verification_documents;
DROP POLICY IF EXISTS "user_insert_own" ON public.verification_documents;
DROP POLICY IF EXISTS "user_update_own" ON public.verification_documents;
DROP POLICY IF EXISTS "admin_all_access" ON public.verification_documents;
DROP POLICY IF EXISTS "service_role_all_access" ON public.verification_documents;
DROP POLICY IF EXISTS "anon_insert_access" ON public.verification_documents;

-- Create comprehensive policies
CREATE POLICY "user_own_documents" ON public.verification_documents
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_all_documents" ON public.verification_documents
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "service_role_all_documents" ON public.verification_documents
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "anon_can_insert" ON public.verification_documents
FOR INSERT TO anon
WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_verification_documents_updated_at ON public.verification_documents;
CREATE TRIGGER update_verification_documents_updated_at
    BEFORE UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update user verification status when documents are approved
CREATE OR REPLACE FUNCTION update_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If document is verified, check if user has both required documents verified
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
        -- Check if user now has both id_card and profile_photo verified
        IF (
            SELECT COUNT(*) 
            FROM public.verification_documents 
            WHERE user_id = NEW.user_id 
            AND document_type IN ('id_card', 'profile_photo')
            AND status = 'verified'
        ) >= 2 THEN
            -- Update user verification status
            UPDATE public.profiles 
            SET 
                verification_status = 'verified',
                status = 'active',
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;

    -- If document is rejected, set user verification to pending
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        UPDATE public.profiles 
        SET 
            verification_status = 'pending',
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_user_verification ON public.verification_documents;
CREATE TRIGGER trigger_update_user_verification
    AFTER UPDATE ON public.verification_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_verification_status();

RAISE NOTICE 'Verification documents table setup completed - ready for database-only storage!';
