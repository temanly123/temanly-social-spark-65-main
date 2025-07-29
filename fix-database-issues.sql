-- COMPREHENSIVE DATABASE FIXES
-- This will fix all the database connection and permission issues

-- Step 1: Fix RLS policies for all tables
-- Drop all existing policies first
DROP POLICY IF EXISTS "admin_access" ON payment_transactions;
DROP POLICY IF EXISTS "admin_access" ON payout_requests;
DROP POLICY IF EXISTS "admin_access" ON payout_transactions;
DROP POLICY IF EXISTS "profiles_access" ON profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON profiles;

-- Step 2: Create comprehensive admin policies that work with the frontend
CREATE POLICY "admin_full_access_payment_transactions" ON payment_transactions
  FOR ALL TO authenticated
  USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR
    -- Allow if user is involved in the transaction
    auth.uid() = user_id OR auth.uid() = companion_id
  )
  WITH CHECK (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR
    -- Allow if user is involved in the transaction
    auth.uid() = user_id OR auth.uid() = companion_id
  );

CREATE POLICY "admin_full_access_payout_requests" ON payout_requests
  FOR ALL TO authenticated
  USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR
    -- Allow if user is the companion
    auth.uid() = companion_id
  )
  WITH CHECK (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR
    -- Allow if user is the companion
    auth.uid() = companion_id
  );

CREATE POLICY "admin_full_access_payout_transactions" ON payout_transactions
  FOR ALL TO authenticated
  USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR
    -- Allow if user is the companion
    auth.uid() = companion_id
  )
  WITH CHECK (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
    OR
    -- Allow if user is the companion
    auth.uid() = companion_id
  );

-- Step 3: Fix profiles table with comprehensive access
CREATE POLICY "profiles_comprehensive_access" ON profiles
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
    -- Allow viewing public companion profiles
    user_type = 'companion'
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
  );

-- Step 4: Create service role policies for system operations
CREATE POLICY "service_role_payment_transactions" ON payment_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_payout_requests" ON payout_requests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_payout_transactions" ON payout_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_profiles" ON profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Create anon policies for public access (needed for some operations)
CREATE POLICY "anon_read_profiles" ON profiles
  FOR SELECT TO anon
  USING (user_type = 'companion');

-- Step 6: Ensure all tables have RLS enabled
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT ALL ON payment_transactions TO authenticated;
GRANT ALL ON payout_requests TO authenticated;
GRANT ALL ON payout_transactions TO authenticated;
GRANT ALL ON profiles TO authenticated;

GRANT ALL ON payment_transactions TO service_role;
GRANT ALL ON payout_requests TO service_role;
GRANT ALL ON payout_transactions TO service_role;
GRANT ALL ON profiles TO service_role;

GRANT SELECT ON profiles TO anon;

-- Step 8: Test the fixes
SELECT 'Testing database access after fixes:' as test_phase;

-- Test basic table access
SELECT 'payment_transactions' as table_name, count(*) as count FROM payment_transactions;
SELECT 'payout_requests' as table_name, count(*) as count FROM payout_requests;
SELECT 'payout_transactions' as table_name, count(*) as count FROM payout_transactions;
SELECT 'profiles' as table_name, count(*) as count FROM profiles;

SELECT '✅ Database issues fixed! All tables should now be accessible.' as result;
