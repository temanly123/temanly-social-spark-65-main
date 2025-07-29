-- Create admin user in Supabase Auth and profiles table
-- Run this in Supabase SQL Editor

-- 1. First, create the admin profile (this will work even without auth user)
INSERT INTO profiles (
  id, 
  email, 
  name, 
  full_name, 
  phone, 
  user_type, 
  verification_status, 
  status, 
  created_at, 
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@temanly.com',
  'Admin User',
  'Admin User',
  '+6281234567890',
  'admin',
  'verified',
  'active',
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
) ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin',
  verification_status = 'verified',
  status = 'active';

-- 2. Create auth user (this requires admin privileges in Supabase)
-- Note: This might need to be done through Supabase Dashboard > Authentication > Users
-- Or use the Supabase CLI: supabase auth create-user admin@temanly.com --password admin123

-- 3. Verify the admin user exists
SELECT 
  id, 
  email, 
  name, 
  user_type, 
  verification_status,
  status
FROM profiles 
WHERE user_type = 'admin';

-- 4. Check current RLS policies for payment_transactions
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
WHERE tablename = 'payment_transactions';

-- 5. Temporarily create a very permissive policy for testing
DROP POLICY IF EXISTS "temp_admin_access" ON payment_transactions;
CREATE POLICY "temp_admin_access" ON payment_transactions
  FOR ALL USING (true) WITH CHECK (true);

SELECT 'Admin user setup completed!' as result;
