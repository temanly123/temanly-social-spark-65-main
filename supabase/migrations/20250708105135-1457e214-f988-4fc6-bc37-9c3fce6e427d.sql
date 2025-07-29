-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view verified talent profiles" ON profiles;

-- Create security definer function to check user type safely
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
BEGIN
  -- Use auth.jwt() to get user metadata directly without querying profiles table
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'user_type')::TEXT,
    'user'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create safe RLS policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (public.get_current_user_type() = 'admin');

-- Allow public to view verified talent profiles for booking
CREATE POLICY "Public can view verified talents" 
ON profiles 
FOR SELECT 
USING (
  user_type = 'companion' AND 
  verification_status = 'verified' AND 
  status = 'active'
);