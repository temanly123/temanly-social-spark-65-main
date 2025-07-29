-- Temporary policy to allow seeding data
-- This should be run manually in the Supabase SQL editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "payment_transactions_insert" ON payment_transactions;
DROP POLICY IF EXISTS "System can insert payment transactions" ON payment_transactions;

-- Create temporary permissive policy for seeding
CREATE POLICY "temp_allow_all_inserts" ON payment_transactions
  FOR INSERT WITH CHECK (true);

-- Also allow updates for seeding
CREATE POLICY "temp_allow_all_updates" ON payment_transactions
  FOR UPDATE USING (true);

-- Note: Remember to remove these policies after seeding and restore proper RLS
