-- Fix RLS policies to allow admin access to financial data
-- Run this in Supabase SQL Editor

-- 1. Check current session and user
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 2. Check if current user is admin
SELECT 
  id, 
  email, 
  user_type 
FROM profiles 
WHERE id = auth.uid();

-- 3. Check current RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('payment_transactions', 'payout_requests', 'payout_transactions');

-- 4. Drop existing conflicting policies and create comprehensive admin policies
DROP POLICY IF EXISTS "temp_admin_access" ON payment_transactions;
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can view all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admins can manage payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "System can insert payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "System can update payment transactions" ON payment_transactions;

-- Create comprehensive admin policy for payment_transactions
CREATE POLICY "admin_full_access_payment_transactions" ON payment_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Create user access policy for payment_transactions
CREATE POLICY "user_own_payment_transactions" ON payment_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = companion_id);

-- Create system policy for payment_transactions (for service operations)
CREATE POLICY "system_payment_transactions" ON payment_transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Fix payout_requests policies
DROP POLICY IF EXISTS "Companions can view their own payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can view all payout requests" ON payout_requests;
DROP POLICY IF EXISTS "Admins can manage payout requests" ON payout_requests;

CREATE POLICY "admin_full_access_payout_requests" ON payout_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "companion_own_payout_requests" ON payout_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = companion_id);

-- 6. Fix payout_transactions policies
DROP POLICY IF EXISTS "Companions can view their own payout transactions" ON payout_transactions;
DROP POLICY IF EXISTS "Admins can view all payout transactions" ON payout_transactions;
DROP POLICY IF EXISTS "Admins can manage payout transactions" ON payout_transactions;

CREATE POLICY "admin_full_access_payout_transactions" ON payout_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "companion_own_payout_transactions" ON payout_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = companion_id);

-- 7. Test data access
SELECT 'Testing payment_transactions access...' as test;
SELECT COUNT(*) as payment_transactions_count FROM payment_transactions;

SELECT 'Testing payout_requests access...' as test;
SELECT COUNT(*) as payout_requests_count FROM payout_requests;

SELECT 'Testing payout_transactions access...' as test;
SELECT COUNT(*) as payout_transactions_count FROM payout_transactions;

-- 8. Show sample data
SELECT 'Sample payment transactions:' as info;
SELECT 
  id,
  service_name,
  amount,
  payment_status,
  created_at
FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'RLS policies fixed successfully!' as result;
