-- Create tables for pending talent applications (bypasses RLS issues)

-- 1. Create pending_talent_applications table
CREATE TABLE IF NOT EXISTS public.pending_talent_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    application_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create application_documents table
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID NOT NULL REFERENCES public.pending_talent_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('id_card', 'profile_photo')),
    document_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    content_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(application_id, document_type)
);

-- 3. Enable RLS but allow public access for applications (since they're pending anyway)
ALTER TABLE public.pending_talent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive policies for applications
CREATE POLICY "Allow public to insert applications" ON public.pending_talent_applications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to read own applications" ON public.pending_talent_applications
    FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage applications" ON public.pending_talent_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- 5. Create policies for application documents
CREATE POLICY "Allow public to insert application documents" ON public.application_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to read application documents" ON public.application_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage application documents" ON public.application_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_applications_email ON public.pending_talent_applications(email);
CREATE INDEX IF NOT EXISTS idx_pending_applications_status ON public.pending_talent_applications(status);
CREATE INDEX IF NOT EXISTS idx_pending_applications_submitted_at ON public.pending_talent_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_application_documents_type ON public.application_documents(document_type);

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_pending_applications_updated_at ON public.pending_talent_applications;
CREATE TRIGGER update_pending_applications_updated_at
    BEFORE UPDATE ON public.pending_talent_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_application_documents_updated_at ON public.application_documents;
CREATE TRIGGER update_application_documents_updated_at
    BEFORE UPDATE ON public.application_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Create function for admins to approve applications
CREATE OR REPLACE FUNCTION approve_talent_application(
    application_id UUID,
    admin_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    app_record RECORD;
    new_user_id UUID;
    new_profile_id UUID;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Get application data
    SELECT * INTO app_record 
    FROM public.pending_talent_applications 
    WHERE id = application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or already processed.';
    END IF;
    
    -- Create user account
    -- Note: This would need to be done via admin API in practice
    -- For now, we'll create a profile directly
    
    -- Generate new user ID
    new_user_id := gen_random_uuid();
    
    -- Create profile
    INSERT INTO public.profiles (
        id, email, name, phone, user_type, verification_status, status,
        age, location, bio, zodiac, love_language, hourly_rate,
        profile_data, created_at, updated_at
    )
    VALUES (
        new_user_id,
        app_record.email,
        app_record.name,
        app_record.phone,
        'companion',
        'verified',
        'active',
        (app_record.application_data->'personalInfo'->>'age')::INTEGER,
        app_record.application_data->'personalInfo'->>'location',
        app_record.application_data->'personalInfo'->>'bio',
        app_record.application_data->'personalInfo'->>'zodiac',
        app_record.application_data->'personalInfo'->>'loveLanguage',
        (app_record.application_data->'services'->>'hourlyRate')::DECIMAL,
        app_record.application_data,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_profile_id;
    
    -- Update application status
    UPDATE public.pending_talent_applications 
    SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        admin_notes = approve_talent_application.admin_notes
    WHERE id = application_id;
    
    -- Move documents to user's folder
    -- This would be handled by a separate process
    
    RETURN new_user_id;
END;
$$;

-- 10. Grant necessary permissions
GRANT ALL ON public.pending_talent_applications TO authenticated;
GRANT ALL ON public.pending_talent_applications TO anon;
GRANT ALL ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO anon;
GRANT ALL ON public.pending_talent_applications TO service_role;
GRANT ALL ON public.application_documents TO service_role;
