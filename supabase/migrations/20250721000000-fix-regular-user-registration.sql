-- Fix regular user registration issues
-- This migration ensures regular users can register and appear in admin backend

-- 1. Update the trigger function to handle regular users properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Creating profile for user: % with email: %', NEW.id, NEW.email;
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
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(
      (NEW.raw_user_meta_data->>'user_type')::user_type, 
      'user'::user_type
    ),
    -- Set verification status based on user type
    CASE 
      WHEN COALESCE((NEW.raw_user_meta_data->>'user_type')::text, 'user') = 'companion' 
      THEN 'pending'::verification_status
      ELSE 'verified'::verification_status  -- Regular users are auto-verified
    END,
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
      WHEN NEW.raw_user_meta_data IS NOT NULL 
      THEN NEW.raw_user_meta_data::JSONB
      ELSE '{}'::JSONB
    END,
    NEW.raw_user_meta_data->>'location', -- Use location as city for now
    COALESCE((NEW.raw_user_meta_data->>'party_buddy_eligible')::boolean, false),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Profile created successfully for user: % with type: %', 
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'user_type')::text, 'user');
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the detailed error
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$function$;

-- 2. Ensure the trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix any existing regular users that might not have profiles
-- This will create profiles for any auth users that don't have them
DO $$
DECLARE
    auth_user RECORD;
    user_metadata JSONB;
    user_type_val TEXT;
BEGIN
    -- Loop through auth users that don't have profiles
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        RAISE NOTICE 'Creating missing profile for user: % (%)', auth_user.id, auth_user.email;
        
        user_metadata := COALESCE(auth_user.raw_user_meta_data, '{}'::jsonb);
        user_type_val := COALESCE(user_metadata->>'user_type', 'user');
        
        INSERT INTO public.profiles (
            id, 
            email, 
            name, 
            full_name,
            phone,
            user_type, 
            verification_status, 
            status,
            profile_data,
            created_at,
            updated_at
        )
        VALUES (
            auth_user.id,
            auth_user.email,
            COALESCE(
                user_metadata->>'name', 
                user_metadata->>'full_name', 
                split_part(auth_user.email, '@', 1)
            ),
            COALESCE(
                user_metadata->>'full_name',
                user_metadata->>'name', 
                split_part(auth_user.email, '@', 1)
            ),
            user_metadata->>'phone',
            user_type_val::user_type,
            CASE 
                WHEN user_type_val = 'companion' THEN 'pending'::verification_status
                ELSE 'verified'::verification_status
            END,
            'active'::user_status,
            user_metadata,
            COALESCE(auth_user.created_at, NOW()),
            NOW()
        );
        
        RAISE NOTICE 'Profile created for user: % as type: %', auth_user.id, user_type_val;
    END LOOP;
END $$;

-- 4. Ensure RLS policies allow regular users to be visible in admin
-- Update the admin policy to include all user types
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  -- Allow service role (for admin functions)
  auth.role() = 'service_role' OR
  -- Allow admin users
  EXISTS (
    SELECT 1 FROM profiles AS admin_profiles 
    WHERE admin_profiles.id = auth.uid() 
    AND admin_profiles.user_type = 'admin'
  )
);

-- 5. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 6. Add index for better performance on admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

RAISE NOTICE 'Regular user registration fix migration completed successfully';
