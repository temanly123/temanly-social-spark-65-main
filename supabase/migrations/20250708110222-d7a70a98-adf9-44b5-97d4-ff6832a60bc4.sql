-- Create missing enum types that are referenced in the code
CREATE TYPE user_type AS ENUM ('user', 'companion', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'pending', 'banned');
CREATE TYPE verification_status AS ENUM ('verified', 'pending', 'rejected');
CREATE TYPE talent_level AS ENUM ('fresh', 'elite', 'vip');
CREATE TYPE service_type AS ENUM ('chat', 'call', 'video_call', 'offline_date', 'party_buddy', 'rent_lover');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'waiting_companion_contact', 'in_progress');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'pending_verification');

-- Update the handle_new_user function to work with the enum types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, user_type, verification_status, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'user'::user_type),
    'pending'::verification_status,
    'active'::user_status
  );
  RETURN NEW;
END;
$function$;

-- Create the trigger to automatically create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();