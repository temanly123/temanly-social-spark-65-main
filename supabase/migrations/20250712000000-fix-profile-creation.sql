-- Fix profile creation issues during talent registration
-- This migration ensures profiles are created properly during signup

-- 1. First, let's check and fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Creating profile for user: %', NEW.id;
  RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Insert into profiles table with comprehensive data
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name,
    phone,
    user_type, 
    verification_status, 
    status,
    age,
    location,
    bio,
    zodiac,
    love_language,
    profile_data,
    city,
    party_buddy_eligible,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'user'::user_type),
    'pending'::verification_status,
    'active'::user_status,
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'age')::INTEGER 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'zodiac',
    NEW.raw_user_meta_data->>'loveLanguage',
    CASE 
      WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data::JSONB
      ELSE '{}'::JSONB
    END,
    NEW.raw_user_meta_data->>'location', -- Use location as city for now
    COALESCE((NEW.raw_user_meta_data->>'party_buddy_eligible')::boolean, false),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the detailed error
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$function$;

-- 2. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix RLS policies for profiles table
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can access all profiles" ON public.profiles;

-- 4. Create comprehensive RLS policies
-- Allow service role full access (for admin functions)
CREATE POLICY "Service role can access all profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read all profiles (for browsing talents)
CREATE POLICY "Users can read all profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile (critical for signup)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND user_type = 'admin'
      )
    );

-- 5. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 6. Create a function to manually create profile if trigger fails
CREATE OR REPLACE FUNCTION public.create_profile_manually(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_type_param user_type DEFAULT 'user'::user_type,
  additional_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Insert the profile
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name,
    phone,
    user_type, 
    verification_status, 
    status,
    age,
    location,
    bio,
    zodiac,
    love_language,
    profile_data,
    city,
    party_buddy_eligible,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    COALESCE(user_name, additional_data->>'name', split_part(user_email, '@', 1)),
    COALESCE(user_name, additional_data->>'name', split_part(user_email, '@', 1)),
    COALESCE(user_phone, additional_data->>'phone'),
    user_type_param,
    'pending'::verification_status,
    'active'::user_status,
    CASE 
      WHEN additional_data->>'age' IS NOT NULL 
      THEN (additional_data->>'age')::INTEGER 
      ELSE NULL 
    END,
    additional_data->>'location',
    additional_data->>'bio',
    additional_data->>'zodiac',
    additional_data->>'loveLanguage',
    additional_data,
    additional_data->>'location',
    COALESCE((additional_data->>'party_buddy_eligible')::boolean, false),
    NOW(),
    NOW()
  )
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- 7. Grant execute permission on the manual creation function
GRANT EXECUTE ON FUNCTION public.create_profile_manually TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_manually TO service_role;

-- 8. Create a function to check if profile exists
CREATE OR REPLACE FUNCTION public.profile_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_flag BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id) INTO exists_flag;
  RETURN exists_flag;
END;
$$;

-- 9. Grant execute permission on the check function
GRANT EXECUTE ON FUNCTION public.profile_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.profile_exists TO service_role;

-- 10. Ensure cleanup_orphaned_documents function exists and is accessible
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_documents()
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_documents TO service_role;
