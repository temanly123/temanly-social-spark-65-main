-- Fix profile_data column type and JSON operator issues

-- First, ensure the profile_data column is properly typed as JSONB
ALTER TABLE public.profiles 
ALTER COLUMN profile_data TYPE JSONB USING 
  CASE 
    WHEN profile_data IS NULL THEN NULL
    WHEN profile_data = '' THEN NULL
    ELSE profile_data::JSONB
  END;

-- Add missing columns that might be needed but ensure they exist first
DO $$ 
BEGIN
    -- Add profile_image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_image') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_image TEXT;
    END IF;
    
    -- Add city column if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
    END IF;
    
    -- Add zodiac column if it doesn't exist (it should exist from migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='zodiac') THEN
        ALTER TABLE public.profiles ADD COLUMN zodiac TEXT;
    END IF;
    
    -- Add love_language column if it doesn't exist (it should exist from migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='love_language') THEN
        ALTER TABLE public.profiles ADD COLUMN love_language TEXT;
    END IF;
    
    -- Add party_buddy_eligible column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='party_buddy_eligible') THEN
        ALTER TABLE public.profiles ADD COLUMN party_buddy_eligible BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update the trigger function to handle the new JSONB type properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert into profiles table with proper JSONB handling
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
    party_buddy_eligible
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'user'::user_type),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'user') = 'companion' THEN 'pending'::verification_status
      ELSE 'verified'::verification_status
    END,
    'active'::user_status,
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL AND NEW.raw_user_meta_data->>'age' ~ '^\d+$' 
      THEN (NEW.raw_user_meta_data->>'age')::integer
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'zodiac',
    NEW.raw_user_meta_data->>'loveLanguage',
    CASE 
      WHEN NEW.raw_user_meta_data IS NOT NULL THEN NEW.raw_user_meta_data::JSONB
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'location', -- Use location as city for now
    COALESCE((NEW.raw_user_meta_data->>'party_buddy_eligible')::boolean, false)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and continue (don't block user creation)
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Ensure RLS policies are properly set
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all profiles (for admin functions)
CREATE POLICY IF NOT EXISTS "Service role can access all profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read all profiles
CREATE POLICY IF NOT EXISTS "Users can read all profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);