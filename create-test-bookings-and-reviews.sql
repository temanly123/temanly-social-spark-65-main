-- Create test bookings and reviews to demonstrate the review system
-- Run this in Supabase SQL Editor

-- First, let's check what profiles we have
SELECT id, name, user_type, email FROM profiles ORDER BY created_at DESC;

-- Create test bookings (using existing profile IDs)
-- Replace these IDs with actual profile IDs from the query above
INSERT INTO bookings (
  id,
  user_id,
  companion_id,
  service_type,
  service_name,
  date,
  duration,
  total_price,
  booking_status,
  customer_name,
  created_at
) VALUES 
(
  gen_random_uuid(),
  '2e88ce00-b8b4-4b8b-8b8b-8b8b8b8b8b8b', -- Replace with actual user ID
  '9153fe0a-6b65-4011-b894-f7268b3abe44', -- Replace with actual talent ID
  'video_call',
  'Video Call',
  '2025-01-27',
  4,
  214500,
  'completed',
  'Amanda Angela Soenoko',
  NOW() - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  '2e88ce00-b8b4-4b8b-8b8b-8b8b8b8b8b8b', -- Replace with actual user ID
  '9153fe0a-6b65-4011-b894-f7268b3abe44', -- Replace with actual talent ID
  'chat',
  'Chat',
  '2025-01-26',
  1,
  30000,
  'completed',
  'Amanda Angela Soenoko',
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  '2e88ce00-b8b4-4b8b-8b8b-8b8b8b8b8b8b', -- Replace with actual user ID
  '9153fe0a-6b65-4011-b894-f7268b3abe44', -- Replace with actual talent ID
  'chat',
  'Chat',
  '2025-01-25',
  1,
  25000,
  'completed',
  'Amanda Angela Soenoko',
  NOW() - INTERVAL '4 days'
);

-- Check if bookings were created
SELECT id, service_type, booking_status, created_at FROM bookings ORDER BY created_at DESC;

-- Create test reviews for the bookings
-- First, get the booking IDs we just created
WITH recent_bookings AS (
  SELECT id, user_id, companion_id, service_type, created_at,
         ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM bookings 
  WHERE booking_status = 'completed'
  ORDER BY created_at DESC
  LIMIT 3
)
INSERT INTO reviews (
  id,
  booking_id,
  reviewer_id,
  reviewee_id,
  rating,
  comment,
  is_verified,
  created_at
)
SELECT 
  gen_random_uuid(),
  rb.id,
  rb.user_id,
  rb.companion_id,
  CASE 
    WHEN rb.rn = 1 THEN 5
    WHEN rb.rn = 2 THEN 4
    ELSE 5
  END,
  CASE 
    WHEN rb.rn = 1 THEN 'Amazing experience! Amanda was very professional and engaging during our video call. Highly recommended!'
    WHEN rb.rn = 2 THEN 'Great chat session. Very friendly and responsive. Would book again!'
    ELSE 'Excellent service! Very professional and made me feel comfortable throughout the session.'
  END,
  CASE 
    WHEN rb.rn = 2 THEN false -- One pending review for admin approval testing
    ELSE true -- Others are pre-approved
  END,
  rb.created_at + INTERVAL '1 day'
FROM recent_bookings rb;

-- Check if reviews were created
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.is_verified,
  r.created_at,
  p1.name as reviewer_name,
  p2.name as reviewee_name
FROM reviews r
LEFT JOIN profiles p1 ON r.reviewer_id = p1.id
LEFT JOIN profiles p2 ON r.reviewee_id = p2.id
ORDER BY r.created_at DESC;

-- Update talent statistics based on verified reviews
UPDATE profiles 
SET 
  average_rating = (
    SELECT AVG(rating::decimal) 
    FROM reviews 
    WHERE reviewee_id = profiles.id AND is_verified = true
  ),
  total_orders = (
    SELECT COUNT(*) 
    FROM bookings 
    WHERE companion_id = profiles.id AND booking_status = 'completed'
  ),
  updated_at = NOW()
WHERE user_type = 'companion';

-- Verify the final state
SELECT 
  p.name,
  p.user_type,
  p.average_rating,
  p.total_orders,
  COUNT(r.id) as total_reviews,
  COUNT(CASE WHEN r.is_verified THEN 1 END) as verified_reviews
FROM profiles p
LEFT JOIN reviews r ON p.id = r.reviewee_id
WHERE p.user_type = 'companion'
GROUP BY p.id, p.name, p.user_type, p.average_rating, p.total_orders;

-- Show summary
SELECT 'Setup completed! Check the results above.' as status;
