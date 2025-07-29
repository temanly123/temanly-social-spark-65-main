-- NUCLEAR DELETE SCRIPT - REMOVE ALL SEED DATA
-- This script will completely wipe all financial data and test users

-- Step 1: Show current data
SELECT 'BEFORE NUCLEAR DELETE:' as status;
SELECT 'payment_transactions' as table_name, count(*) as count FROM payment_transactions
UNION ALL
SELECT 'payout_requests' as table_name, count(*) as count FROM payout_requests
UNION ALL
SELECT 'payout_transactions' as table_name, count(*) as count FROM payout_transactions
UNION ALL
SELECT 'bookings' as table_name, count(*) as count FROM bookings
UNION ALL
SELECT 'profiles' as table_name, count(*) as count FROM profiles;

-- Step 2: Temporarily disable RLS for cleanup
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: NUCLEAR DELETE - Remove ALL data
-- This is the most aggressive approach that will definitely work

-- Delete ALL payment transactions
DELETE FROM payment_transactions;

-- Delete ALL payout requests
DELETE FROM payout_requests;

-- Delete ALL payout transactions  
DELETE FROM payout_transactions;

-- Delete ALL bookings
DELETE FROM bookings;

-- Delete test profiles only (keep real users if any)
DELETE FROM profiles 
WHERE email IN (
  'customer1@test.com', 'customer2@test.com', 'customer3@test.com',
  'companion1@test.com', 'companion2@test.com', 'companion3@test.com',
  'ada@temanly.com'
) OR email LIKE '%test.com';

-- Step 4: Re-enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple admin policies
-- Drop any existing policies first
DROP POLICY IF EXISTS "admin_access" ON payment_transactions;
DROP POLICY IF EXISTS "admin_access" ON payout_requests;
DROP POLICY IF EXISTS "admin_access" ON payout_transactions;

-- Create simple admin-only policies
CREATE POLICY "admin_access" ON payment_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "admin_access" ON payout_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "admin_access" ON payout_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Step 6: Show final results
SELECT 'AFTER NUCLEAR DELETE:' as status;
SELECT 'payment_transactions' as table_name, count(*) as count FROM payment_transactions
UNION ALL
SELECT 'payout_requests' as table_name, count(*) as count FROM payout_requests
UNION ALL
SELECT 'payout_transactions' as table_name, count(*) as count FROM payout_transactions
UNION ALL
SELECT 'bookings' as table_name, count(*) as count FROM bookings
UNION ALL
SELECT 'profiles' as table_name, count(*) as count FROM profiles;

-- Step 7: Verify no test data remains
SELECT 'REMAINING TEST DATA:' as status;
SELECT email, user_type FROM profiles 
WHERE email LIKE '%test.com' OR email = 'ada@temanly.com';

SELECT '🚀 NUCLEAR DELETE COMPLETED! Your dashboard should now show 0 for everything!' as final_result;
