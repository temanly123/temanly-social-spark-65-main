-- Check if admin user exists and create one if needed
SELECT 
  id, 
  email, 
  name, 
  user_type, 
  verification_status,
  status
FROM profiles 
WHERE user_type = 'admin';

-- If no admin exists, create one
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
) ON CONFLICT (id) DO NOTHING;

-- Check payment transactions count
SELECT COUNT(*) as transaction_count FROM payment_transactions;

-- Check if we can see the transactions (this might fail due to RLS)
SELECT 
  id,
  service_name,
  amount,
  payment_status,
  created_at
FROM payment_transactions 
ORDER BY created_at DESC 
LIMIT 5;
