-- Fix payment_transactions RLS policies to allow admin inserts
-- This migration adds missing admin policies for payment_transactions

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "System can insert payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert" ON payment_transactions;

-- Create comprehensive admin policy for payment_transactions
CREATE POLICY "Admins can manage payment transactions" ON payment_transactions
  FOR ALL USING (
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

-- Create system-wide insert policy (for service role and system operations)
CREATE POLICY "System can insert payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (true);

-- Create system-wide update policy (for service role and system operations)  
CREATE POLICY "System can update payment transactions" ON payment_transactions
  FOR UPDATE USING (true);

-- Ensure the policies are applied
NOTIFY pgrst, 'reload schema';
