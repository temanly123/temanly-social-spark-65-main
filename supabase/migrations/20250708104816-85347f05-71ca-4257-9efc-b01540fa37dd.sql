-- Drop existing policies if they exist and recreate them properly
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Talents can view own comprehensive profile" ON profiles;  
DROP POLICY IF EXISTS "Public can view verified talent profiles" ON profiles;

-- Ensure RLS policies allow proper data access for profiles
-- Add policy for admins to view all profiles for management
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles AS admin_profiles 
    WHERE admin_profiles.id = auth.uid() 
    AND admin_profiles.user_type = 'admin'
  )
);

-- Allow anyone to view basic talent profiles for booking purposes
CREATE POLICY "Public can view verified talent profiles" 
ON profiles 
FOR SELECT 
USING (
  user_type = 'companion' AND 
  verification_status = 'verified' AND 
  status = 'active'
);