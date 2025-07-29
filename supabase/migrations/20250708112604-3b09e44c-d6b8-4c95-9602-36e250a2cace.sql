-- First, check if the enum types exist, and create them if they don't
DO $$ 
BEGIN
    -- Create user_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('user', 'companion', 'admin');
    END IF;
    
    -- Create user_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending', 'banned');
    END IF;
    
    -- Create verification_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'rejected');
    END IF;
    
    -- Create talent_level enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'talent_level') THEN
        CREATE TYPE talent_level AS ENUM ('fresh', 'elite', 'vip');
    END IF;
    
    -- Create service_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
        CREATE TYPE service_type AS ENUM ('chat', 'call', 'video_call', 'offline_date', 'party_buddy', 'rent_lover');
    END IF;
    
    -- Create booking_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'waiting_companion_contact', 'in_progress');
    END IF;
    
    -- Create payment_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'pending_verification');
    END IF;
END $$;

-- Create or replace the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert into profiles table with better error handling
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
    profile_data
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
      WHEN NEW.raw_user_meta_data->>'age' IS NOT NULL THEN (NEW.raw_user_meta_data->>'age')::integer
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'location',
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'zodiac',
    NEW.raw_user_meta_data->>'loveLanguage',
    NEW.raw_user_meta_data
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and continue (don't block user creation)
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();