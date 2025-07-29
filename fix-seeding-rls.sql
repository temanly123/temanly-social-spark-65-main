-- FIX SEEDING RLS POLICY
-- This will allow the seeding component to create test data

-- Fix profiles table RLS for seeding
DROP POLICY IF EXISTS "admin_access" ON profiles;
DROP POLICY IF EXISTS "Users can view and update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create comprehensive profiles policy
CREATE POLICY "profiles_access" ON profiles
  FOR ALL TO authenticated
  USING (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
    OR
    -- Users can see their own
    id = auth.uid()
    OR
    -- Public profiles viewable by all authenticated users
    true
  )
  WITH CHECK (
    -- Admin can create/update all
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
    OR
    -- Users can update their own
    id = auth.uid()
    OR
    -- Allow creation of new profiles (for seeding)
    id IS NULL
  );

-- Also create a service role policy for seeding
CREATE POLICY "service_role_profiles" ON profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

SELECT '✅ Seeding RLS policies fixed! You can now seed test data.' as result;
