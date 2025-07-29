-- Manual seed script for financial data
-- Run this in Supabase SQL Editor if the component fails

-- 1. Insert admin profile
INSERT INTO profiles (
  id, email, name, full_name, phone, user_type, verification_status, status, created_at, updated_at
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

-- 2. Insert companion profiles
INSERT INTO profiles (
  id, email, name, full_name, phone, user_type, verification_status, status, talent_level, age, location, bio, city, average_rating, total_orders, created_at, updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'yasmina@temanly.com',
  'Yasmina Dwiariani',
  'Yasmina Dwiariani',
  '+6281234567890',
  'companion',
  'verified',
  'active',
  'vip',
  24,
  'Jakarta',
  'Elegant and sophisticated companion for upscale events',
  'Jakarta',
  4.9,
  15,
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
),
(
  '22222222-2222-2222-2222-222222222222',
  'amanda@temanly.com',
  'Amanda Soenoko',
  'Amanda Soenoko',
  '+6281234567891',
  'companion',
  'verified',
  'active',
  'elite',
  23,
  'Jakarta',
  'Charming and intelligent companion for various occasions',
  'Jakarta',
  4.7,
  12,
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
),
(
  '33333333-3333-3333-3333-333333333333',
  'sarah@temanly.com',
  'Sarah Johnson',
  'Sarah Johnson',
  '+6281234567892',
  'companion',
  'verified',
  'active',
  'fresh',
  22,
  'Jakarta',
  'Friendly and energetic companion for fun activities',
  'Jakarta',
  4.5,
  8,
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- 3. Insert customer profiles
INSERT INTO profiles (
  id, email, name, full_name, phone, user_type, verification_status, status, age, location, city, created_at, updated_at
) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  'customer1@example.com',
  'John Doe',
  'John Doe',
  '+6281234567893',
  'user',
  'verified',
  'active',
  28,
  'Jakarta',
  'Jakarta',
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
),
(
  '55555555-5555-5555-5555-555555555555',
  'customer2@example.com',
  'Michael Smith',
  'Michael Smith',
  '+6281234567894',
  'user',
  'verified',
  'active',
  32,
  'Jakarta',
  'Jakarta',
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
),
(
  '66666666-6666-6666-6666-666666666666',
  'customer3@example.com',
  'David Wilson',
  'David Wilson',
  '+6281234567895',
  'user',
  'verified',
  'active',
  35,
  'Jakarta',
  'Jakarta',
  '2024-01-01T00:00:00Z',
  '2024-01-01T00:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- 4. Temporarily allow all inserts for payment_transactions
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON payment_transactions;
CREATE POLICY "temp_allow_all_inserts" ON payment_transactions FOR INSERT WITH CHECK (true);

-- 5. Insert payment transactions
INSERT INTO payment_transactions (
  id, user_id, companion_id, amount, platform_fee, companion_earnings, commission_rate,
  service_name, service_type, duration, payment_status, payment_method, midtrans_order_id,
  created_at, updated_at, paid_at
) VALUES 
(
  '10000001-1000-4000-8000-100000000001',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  280500, -- 255000 + 25500 app fee
  25500,  -- 10% app fee
  216750, -- 255000 - 38250 commission (15%)
  15,     -- VIP commission rate
  'Dinner Companion',
  'offline_date',
  3,
  'paid',
  'midtrans',
  'ORDER-2024011501',
  '2024-01-15T16:00:00Z',
  '2024-01-15T19:30:00Z',
  '2024-01-15T19:30:00Z'
),
(
  '10000002-1000-4000-8000-100000000002',
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  330000, -- 300000 + 30000 app fee
  30000,  -- 10% app fee
  246000, -- 300000 - 54000 commission (18%)
  18,     -- Elite commission rate
  'Event Companion',
  'party_buddy',
  4,
  'paid',
  'midtrans',
  'ORDER-2024012001',
  '2024-01-20T10:00:00Z',
  '2024-01-20T14:30:00Z',
  '2024-01-20T14:30:00Z'
),
(
  '10000003-1000-4000-8000-100000000003',
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333333',
  627000, -- 570000 + 57000 app fee
  57000,  -- 10% app fee
  456000, -- 570000 - 114000 commission (20%)
  20,     -- Fresh commission rate
  'Business Companion',
  'offline_date',
  6,
  'paid',
  'midtrans',
  'ORDER-2024012501',
  '2024-01-25T07:00:00Z',
  '2024-01-25T09:30:00Z',
  '2024-01-25T09:30:00Z'
) ON CONFLICT (id) DO NOTHING;

-- 6. Clean up temporary policy
DROP POLICY IF EXISTS "temp_allow_all_inserts" ON payment_transactions;

-- 7. Restore proper RLS policies
CREATE POLICY "System can insert payment transactions" ON payment_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage payment transactions" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

SELECT 'Financial data seeded successfully!' as result;
