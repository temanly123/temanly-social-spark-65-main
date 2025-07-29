-- Ensure RLS policies allow proper data access for profiles
-- Add policy for admins to view all profiles for management
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin_profiles 
    WHERE admin_profiles.id = auth.uid() 
    AND admin_profiles.user_type = 'admin'
  )
);

-- Ensure talents can view their own comprehensive profiles
CREATE POLICY IF NOT EXISTS "Talents can view own comprehensive profile" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  user_type = 'companion' OR
  verification_status = 'verified'
);

-- Allow anyone to view basic talent profiles for booking purposes
CREATE POLICY IF NOT EXISTS "Public can view verified talent profiles" 
ON profiles 
FOR SELECT 
USING (
  user_type = 'companion' AND 
  verification_status = 'verified' AND 
  status = 'active'
);