-- Debug review approval issue
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check current reviews and their status
SELECT 
  id,
  rating,
  comment,
  is_verified,
  admin_notes,
  verified_at,
  created_at,
  updated_at
FROM reviews 
ORDER BY created_at DESC;

-- 2. Check RLS policies on reviews table
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
WHERE tablename = 'reviews';

-- 3. Test manual approval of a review (replace with actual review ID)
-- First, let's see what reviews we have
WITH review_to_approve AS (
  SELECT id FROM reviews WHERE is_verified = false LIMIT 1
)
UPDATE reviews 
SET 
  is_verified = true,
  admin_notes = 'Manually approved via SQL',
  verified_at = NOW(),
  updated_at = NOW()
WHERE id = (SELECT id FROM review_to_approve)
RETURNING id, is_verified, admin_notes, verified_at;

-- 4. Verify the update worked
SELECT 
  id,
  is_verified,
  admin_notes,
  verified_at,
  updated_at
FROM reviews 
WHERE admin_notes = 'Manually approved via SQL';

-- 5. Check if there are any triggers or functions that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'reviews';

-- 6. Check table permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'reviews';

-- 7. Create a test review if none exist
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
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE user_type = 'user' OR user_type IS NULL LIMIT 1),
  (SELECT id FROM profiles WHERE user_type = 'companion' LIMIT 1),
  5,
  'Test review for debugging approval issue',
  false,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE comment LIKE '%debugging approval issue%');

-- 8. Show final state
SELECT 
  'Review approval debug completed' as status,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN is_verified THEN 1 END) as approved_reviews,
  COUNT(CASE WHEN NOT is_verified THEN 1 END) as pending_reviews
FROM reviews;
