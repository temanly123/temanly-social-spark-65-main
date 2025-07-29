-- Seed Financial Data for Testing
-- This script creates realistic sample payment transactions and related data

-- First, let's ensure we have some companion profiles
INSERT INTO profiles (id, name, full_name, email, user_type, phone, age, location, bio, hourly_rate, verification_status, profile_data)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Yasmina Dwiariani', 'Yasmina Dwiariani', 'yasmina@temanly.com', 'companion', '08782245123', 25, 'Jakarta', 'Experienced companion with great conversation skills', 85000, 'verified', '{}'),
  ('22222222-2222-2222-2222-222222222222', 'Amanda Soenoko', 'Amanda Soenoko', 'amanda@temanly.com', 'companion', '08123456789', 23, 'Bandung', 'Friendly and professional companion', 75000, 'verified', '{}'),
  ('33333333-3333-3333-3333-333333333333', 'Sarah Johnson', 'Sarah Johnson', 'sarah@temanly.com', 'companion', '08987654321', 27, 'Surabaya', 'Professional companion for business events', 95000, 'verified', '{}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  age = EXCLUDED.age,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio,
  hourly_rate = EXCLUDED.hourly_rate,
  verification_status = EXCLUDED.verification_status,
  profile_data = EXCLUDED.profile_data;

-- Create some customer profiles
INSERT INTO profiles (id, name, full_name, email, user_type, phone, verification_status, profile_data)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'John Customer', 'John Customer', 'john@customer.com', 'user', '08111111111', 'verified', '{}'),
  ('55555555-5555-5555-5555-555555555555', 'Jane Customer', 'Jane Customer', 'jane@customer.com', 'user', '08222222222', 'verified', '{}'),
  ('66666666-6666-6666-6666-666666666666', 'Bob Customer', 'Bob Customer', 'bob@customer.com', 'user', '08333333333', 'verified', '{}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  verification_status = EXCLUDED.verification_status,
  profile_data = EXCLUDED.profile_data;

-- Create some bookings
INSERT INTO bookings (id, user_id, companion_id, service_type, date, duration, total_price, booking_status, payment_status, customer_phone, created_at)
VALUES 
  ('booking-1', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'dinner_companion', '2024-01-15 19:00:00', 3, 255000, 'completed', 'paid', '08111111111', '2024-01-15 16:00:00'),
  ('booking-2', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'event_companion', '2024-01-20 14:00:00', 4, 300000, 'completed', 'paid', '08222222222', '2024-01-20 10:00:00'),
  ('booking-3', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'business_companion', '2024-01-25 09:00:00', 6, 570000, 'completed', 'paid', '08333333333', '2024-01-25 07:00:00'),
  ('booking-4', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'casual_hangout', '2024-02-01 15:00:00', 2, 170000, 'completed', 'paid', '08111111111', '2024-02-01 12:00:00'),
  ('booking-5', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'dinner_companion', '2024-02-05 18:00:00', 3, 225000, 'completed', 'paid', '08222222222', '2024-02-05 15:00:00'),
  ('booking-6', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'event_companion', '2024-02-10 16:00:00', 5, 475000, 'completed', 'paid', '08333333333', '2024-02-10 13:00:00'),
  ('booking-7', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'business_companion', '2024-02-15 10:00:00', 4, 340000, 'completed', 'paid', '08111111111', '2024-02-15 08:00:00'),
  ('booking-8', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'casual_hangout', '2024-02-20 13:00:00', 2, 150000, 'completed', 'paid', '08222222222', '2024-02-20 11:00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  companion_id = EXCLUDED.companion_id,
  service_type = EXCLUDED.service_type,
  date = EXCLUDED.date,
  duration = EXCLUDED.duration,
  total_price = EXCLUDED.total_price,
  booking_status = EXCLUDED.booking_status,
  payment_status = EXCLUDED.payment_status,
  customer_phone = EXCLUDED.customer_phone,
  created_at = EXCLUDED.created_at;

-- Create payment transactions
INSERT INTO payment_transactions (
  id, booking_id, user_id, companion_id, amount, service_name, service_type, duration,
  platform_fee, companion_earnings, commission_rate, payment_status, payment_method,
  midtrans_order_id, created_at, updated_at, paid_at
)
VALUES 
  -- January transactions
  ('pay-1', 'booking-1', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 
   255000, 'Dinner Companion', 'dinner_companion', 3, 25500, 229500, 0.10, 'paid', 'midtrans', 
   'ORDER-2024011501', '2024-01-15 16:00:00', '2024-01-15 19:30:00', '2024-01-15 19:30:00'),
   
  ('pay-2', 'booking-2', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 
   300000, 'Event Companion', 'event_companion', 4, 30000, 270000, 0.10, 'paid', 'midtrans', 
   'ORDER-2024012001', '2024-01-20 10:00:00', '2024-01-20 14:30:00', '2024-01-20 14:30:00'),
   
  ('pay-3', 'booking-3', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 
   570000, 'Business Companion', 'business_companion', 6, 57000, 513000, 0.10, 'paid', 'midtrans', 
   'ORDER-2024012501', '2024-01-25 07:00:00', '2024-01-25 09:30:00', '2024-01-25 09:30:00'),
   
  -- February transactions
  ('pay-4', 'booking-4', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 
   170000, 'Casual Hangout', 'casual_hangout', 2, 17000, 153000, 0.10, 'paid', 'midtrans', 
   'ORDER-2024020101', '2024-02-01 12:00:00', '2024-02-01 15:30:00', '2024-02-01 15:30:00'),
   
  ('pay-5', 'booking-5', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 
   225000, 'Dinner Companion', 'dinner_companion', 3, 22500, 202500, 0.10, 'paid', 'midtrans', 
   'ORDER-2024020501', '2024-02-05 15:00:00', '2024-02-05 18:30:00', '2024-02-05 18:30:00'),
   
  ('pay-6', 'booking-6', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 
   475000, 'Event Companion', 'event_companion', 5, 47500, 427500, 0.10, 'paid', 'midtrans', 
   'ORDER-2024021001', '2024-02-10 13:00:00', '2024-02-10 16:30:00', '2024-02-10 16:30:00'),
   
  ('pay-7', 'booking-7', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 
   340000, 'Business Companion', 'business_companion', 4, 34000, 306000, 0.10, 'paid', 'midtrans', 
   'ORDER-2024021501', '2024-02-15 08:00:00', '2024-02-15 10:30:00', '2024-02-15 10:30:00'),
   
  ('pay-8', 'booking-8', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 
   150000, 'Casual Hangout', 'casual_hangout', 2, 15000, 135000, 0.10, 'paid', 'midtrans', 
   'ORDER-2024022001', '2024-02-20 11:00:00', '2024-02-20 13:30:00', '2024-02-20 13:30:00')
ON CONFLICT (id) DO UPDATE SET
  booking_id = EXCLUDED.booking_id,
  user_id = EXCLUDED.user_id,
  companion_id = EXCLUDED.companion_id,
  amount = EXCLUDED.amount,
  service_name = EXCLUDED.service_name,
  service_type = EXCLUDED.service_type,
  duration = EXCLUDED.duration,
  platform_fee = EXCLUDED.platform_fee,
  companion_earnings = EXCLUDED.companion_earnings,
  commission_rate = EXCLUDED.commission_rate,
  payment_status = EXCLUDED.payment_status,
  payment_method = EXCLUDED.payment_method,
  midtrans_order_id = EXCLUDED.midtrans_order_id,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  paid_at = EXCLUDED.paid_at;

-- Create some payout requests
INSERT INTO payout_requests (
  id, companion_id, requested_amount, bank_name, account_number, account_holder_name,
  payout_method, status, created_at, processed_at
)
VALUES 
  ('payout-1', '11111111-1111-1111-1111-111111111111', 500000, 'BCA', '1234567890', 'Yasmina Dwiariani', 
   'bank_transfer', 'approved', '2024-01-30 10:00:00', '2024-01-30 14:00:00'),
   
  ('payout-2', '22222222-2222-2222-2222-222222222222', 300000, 'Mandiri', '0987654321', 'Amanda Soenoko', 
   'bank_transfer', 'approved', '2024-02-10 09:00:00', '2024-02-10 15:00:00'),
   
  ('payout-3', '33333333-3333-3333-3333-333333333333', 400000, 'BNI', '1122334455', 'Sarah Johnson', 
   'bank_transfer', 'pending', '2024-02-25 11:00:00', NULL)
ON CONFLICT (id) DO UPDATE SET
  companion_id = EXCLUDED.companion_id,
  requested_amount = EXCLUDED.requested_amount,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  account_holder_name = EXCLUDED.account_holder_name,
  payout_method = EXCLUDED.payout_method,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  processed_at = EXCLUDED.processed_at;

-- Create payout financial records for approved payouts
INSERT INTO payment_transactions (
  id, companion_id, amount, service_name, service_type, duration,
  platform_fee, companion_earnings, commission_rate, payment_status, payment_method,
  created_at, updated_at
)
VALUES 
  ('payout-pay-1', '11111111-1111-1111-1111-111111111111', -500000, 'Payout', 'payout', 0,
   0, -500000, 0, 'paid', 'bank_transfer', '2024-01-30 14:00:00', '2024-01-30 14:00:00'),
   
  ('payout-pay-2', '22222222-2222-2222-2222-222222222222', -300000, 'Payout', 'payout', 0,
   0, -300000, 0, 'paid', 'bank_transfer', '2024-02-10 15:00:00', '2024-02-10 15:00:00')
ON CONFLICT (id) DO UPDATE SET
  companion_id = EXCLUDED.companion_id,
  amount = EXCLUDED.amount,
  service_name = EXCLUDED.service_name,
  service_type = EXCLUDED.service_type,
  duration = EXCLUDED.duration,
  platform_fee = EXCLUDED.platform_fee,
  companion_earnings = EXCLUDED.companion_earnings,
  commission_rate = EXCLUDED.commission_rate,
  payment_status = EXCLUDED.payment_status,
  payment_method = EXCLUDED.payment_method,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

-- Summary of what this creates:
-- Total Revenue: Rp 2,485,000
-- Platform Fees: Rp 248,500 (10%)
-- Companion Earnings: Rp 2,236,500 (90%)
-- Payouts Made: Rp 800,000
-- Available Earnings: Rp 1,436,500
-- Pending Payouts: Rp 400,000
