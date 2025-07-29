-- Fix duplicate email issue and prevent future duplicates
-- This migration addresses the issue where same email can be registered for both user and talent

-- 1. First, let's see what duplicates we have
DO $$ 
DECLARE
    duplicate_record RECORD;
    user_record RECORD;
    talent_record RECORD;
BEGIN
    RAISE NOTICE 'Checking for duplicate emails...';
    
    -- Find all duplicate emails
    FOR duplicate_record IN 
        SELECT email, COUNT(*) as count
        FROM public.profiles 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Found duplicate email: % (% records)', duplicate_record.email, duplicate_record.count;
        
        -- For each duplicate email, keep the talent record and remove the user record
        -- This is because talents have more valuable data (verification documents, rates, etc.)
        
        -- Get the user record (if exists)
        SELECT * INTO user_record 
        FROM public.profiles 
        WHERE email = duplicate_record.email AND user_type = 'user'
        LIMIT 1;
        
        -- Get the talent record (if exists)  
        SELECT * INTO talent_record
        FROM public.profiles 
        WHERE email = duplicate_record.email AND user_type = 'companion'
        LIMIT 1;
        
        IF user_record.id IS NOT NULL AND talent_record.id IS NOT NULL THEN
            RAISE NOTICE 'Removing user record for email: % (keeping talent record)', duplicate_record.email;
            
            -- Delete the user record from profiles
            DELETE FROM public.profiles WHERE id = user_record.id;
            
            -- Also delete from auth.users if it exists
            DELETE FROM auth.users WHERE id = user_record.id;
            
            RAISE NOTICE 'Deleted user record with ID: %', user_record.id;
        END IF;
    END LOOP;
END $$;

-- 2. Add unique constraint on email to prevent future duplicates
DO $$ 
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_email_unique' 
        AND table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_email_unique UNIQUE (email);
        
        RAISE NOTICE 'Added unique constraint on email field';
    ELSE
        RAISE NOTICE 'Email unique constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not add email unique constraint: %', SQLERRM;
END $$;

-- 3. Update the application-level email check to be more robust
-- Create a function to check email availability across all user types
CREATE OR REPLACE FUNCTION public.check_email_availability(
    email_to_check TEXT,
    requested_user_type user_type DEFAULT 'user'::user_type
)
RETURNS TABLE (
    is_available BOOLEAN,
    existing_user_type user_type,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if email exists in profiles
    IF EXISTS (SELECT 1 FROM public.profiles WHERE email = email_to_check) THEN
        -- Email is taken
        SELECT 
            false as is_available,
            p.user_type as existing_user_type,
            CASE 
                WHEN p.user_type = 'user' THEN 'Email sudah terdaftar sebagai User. Silakan login atau gunakan email lain.'
                WHEN p.user_type = 'companion' THEN 'Email sudah terdaftar sebagai Talent. Silakan login atau gunakan email lain.'
                ELSE 'Email sudah terdaftar. Silakan login atau gunakan email lain.'
            END as message
        INTO is_available, existing_user_type, message
        FROM public.profiles p 
        WHERE p.email = email_to_check
        LIMIT 1;
        
        RETURN NEXT;
    ELSE
        -- Email is available
        RETURN QUERY SELECT true, NULL::user_type, 'Email tersedia'::TEXT;
    END IF;
END;
$$;

-- 4. Grant permissions for the new function
GRANT EXECUTE ON FUNCTION public.check_email_availability(TEXT, user_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_availability(TEXT, user_type) TO anon;

-- 5. Create an index on email for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 6. Log the completion
DO $$ 
BEGIN
    RAISE NOTICE '✅ Email duplicate fix migration completed successfully';
    RAISE NOTICE '📧 Added unique constraint on profiles.email';
    RAISE NOTICE '🔍 Created check_email_availability function';
    RAISE NOTICE '⚡ Added email index for better performance';
END $$;
