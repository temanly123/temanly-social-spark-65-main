-- Fix review approval issue
-- This script addresses both RLS policies and approval functionality

-- 1. First, let's see what we're working with
SELECT 'Current reviews:' as info;
SELECT id, rating, is_verified, admin_notes, created_at FROM reviews ORDER BY created_at DESC;

-- 2. Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'reviews';

-- 3. Drop existing problematic policies and create better ones
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Talents can view their reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view verified reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view verified reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON reviews;

-- 4. Create comprehensive RLS policies that work properly
-- Allow authenticated users to create reviews
CREATE POLICY "authenticated_can_create_reviews" ON reviews
FOR INSERT TO authenticated
WITH CHECK (reviewer_id = auth.uid());

-- Allow everyone to view verified reviews
CREATE POLICY "anyone_can_view_verified_reviews" ON reviews
FOR SELECT TO authenticated, anon
USING (is_verified = true);

-- Allow users to view their own reviews (both given and received)
CREATE POLICY "users_can_view_own_reviews" ON reviews
FOR SELECT TO authenticated
USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

-- Allow service role to do everything (for admin operations)
CREATE POLICY "service_role_full_access" ON reviews
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users with admin privileges to manage all reviews
CREATE POLICY "admins_can_manage_all_reviews" ON reviews
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (user_type = 'admin' OR email LIKE '%admin%' OR email = 'amandasoenoko@gmail.com')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (user_type = 'admin' OR email LIKE '%admin%' OR email = 'amandasoenoko@gmail.com')
    )
);

-- 5. Ensure RLS is enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON reviews TO service_role;
GRANT ALL ON reviews TO anon;

-- 7. Create test bookings first (needed for foreign key constraint)
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
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE user_type != 'companion' OR user_type IS NULL LIMIT 1),
  (SELECT id FROM profiles WHERE user_type = 'companion' LIMIT 1),
  'video_call',
  'Video Call',
  CURRENT_DATE - INTERVAL '1 day',
  4,
  200000,
  'completed',
  (SELECT name FROM profiles WHERE user_type != 'companion' OR user_type IS NULL LIMIT 1),
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM bookings)
AND EXISTS (SELECT 1 FROM profiles WHERE user_type = 'companion')
AND EXISTS (SELECT 1 FROM profiles WHERE user_type != 'companion' OR user_type IS NULL);

-- Add another test booking
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
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE user_type != 'companion' OR user_type IS NULL LIMIT 1),
  (SELECT id FROM profiles WHERE user_type = 'companion' LIMIT 1),
  'chat',
  'Chat',
  CURRENT_DATE - INTERVAL '2 days',
  1,
  50000,
  'completed',
  (SELECT name FROM profiles WHERE user_type != 'companion' OR user_type IS NULL LIMIT 1),
  NOW() - INTERVAL '2 days'
WHERE (SELECT COUNT(*) FROM bookings) < 2
AND EXISTS (SELECT 1 FROM profiles WHERE user_type = 'companion')
AND EXISTS (SELECT 1 FROM profiles WHERE user_type != 'companion' OR user_type IS NULL);

-- 8. Now create reviews using the existing bookings
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
  b.id,
  b.user_id,
  b.companion_id,
  5,
  'Amazing experience! Very professional and engaging.',
  false, -- Start as pending for testing approval
  NOW() - INTERVAL '1 day'
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE booking_id = b.id)
AND b.booking_status = 'completed'
LIMIT 1;

-- Add another test review
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
  b.id,
  b.user_id,
  b.companion_id,
  4,
  'Great service! Would recommend to others.',
  true, -- This one is already approved
  NOW() - INTERVAL '2 days'
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE booking_id = b.id)
AND b.booking_status = 'completed'
AND b.id != (SELECT booking_id FROM reviews LIMIT 1)
LIMIT 1;

-- 9. Test the approval functionality
UPDATE reviews
SET
  is_verified = true,
  admin_notes = 'Approved during setup',
  verified_at = NOW(),
  updated_at = NOW()
WHERE is_verified = false
AND id = (SELECT id FROM reviews WHERE is_verified = false LIMIT 1);

-- 10. Show final results
SELECT 'Final review status:' as info;
SELECT
  r.id,
  r.rating,
  r.comment,
  r.is_verified,
  r.admin_notes,
  r.verified_at,
  r.created_at,
  b.service_type,
  p1.name as reviewer_name,
  p2.name as reviewee_name
FROM reviews r
LEFT JOIN bookings b ON r.booking_id = b.id
LEFT JOIN profiles p1 ON r.reviewer_id = p1.id
LEFT JOIN profiles p2 ON r.reviewee_id = p2.id
ORDER BY r.created_at DESC;

-- 11. Show statistics
SELECT
  'Review Statistics:' as info,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN is_verified THEN 1 END) as approved_reviews,
  COUNT(CASE WHEN NOT is_verified THEN 1 END) as pending_reviews,
  ROUND(AVG(rating), 2) as average_rating
FROM reviews;

-- 12. Show bookings created
SELECT 'Bookings created:' as info;
SELECT
  id,
  service_type,
  booking_status,
  customer_name,
  created_at
FROM bookings
ORDER BY created_at DESC;

-- 13. Verify policies are working
SELECT 'RLS Policies created:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'reviews';

SELECT 'Setup completed successfully!' as status;
