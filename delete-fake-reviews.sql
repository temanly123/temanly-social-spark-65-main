-- Delete all fake reviews from the database
-- This script removes reviews associated with mock/demo data

-- First, let's see what reviews exist
SELECT 
  r.id,
  r.rating,
  r.review_text,
  r.created_at,
  p_talent.name as talent_name,
  p_user.name as user_name
FROM reviews r
LEFT JOIN profiles p_talent ON r.talent_id = p_talent.id
LEFT JOIN profiles p_user ON r.user_id = p_user.id
ORDER BY r.created_at DESC;

-- Delete reviews for Amanda Angela Soenoko (our test user)
DELETE FROM reviews 
WHERE talent_id IN (
  SELECT id FROM profiles 
  WHERE name = 'Amanda Angela Soenoko' 
  OR email = 'amanda.angela.soenoko@gmail.com'
);

-- Delete reviews by demo users (fake user IDs)
DELETE FROM reviews 
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005'
);

-- Delete reviews with demo/test content
DELETE FROM reviews 
WHERE review_text ILIKE '%demo%' 
   OR review_text ILIKE '%test%' 
   OR review_text ILIKE '%sample%'
   OR review_text ILIKE '%Sari sangat membantu%'
   OR review_text ILIKE '%Content creation tips%'
   OR review_text ILIKE '%Great conversation partner%'
   OR review_text ILIKE '%Sari is amazing%'
   OR review_text ILIKE '%Enjoyed our museum date%';

-- Delete reviews for other mock talents
DELETE FROM reviews 
WHERE talent_id IN (
  SELECT id FROM profiles 
  WHERE name IN (
    'Maya Sari', 'Rina Putri', 'Sari Indah', 'Dina Cantik', 'Luna Manis',
    'Sarah Michelle', 'Amanda Rose', 'Jessica Liu', 'Sari Dewi', 'Amanda Fitri'
  )
  OR email IN (
    'maya.sari@temanly.com',
    'rina.putri@temanly.com', 
    'sari.indah@temanly.com',
    'dina.cantik@temanly.com',
    'luna.manis@temanly.com',
    'demo@temanly.com',
    'user@demo.com', 
    'test@test.com'
  )
);

-- Verify all reviews are deleted
SELECT COUNT(*) as remaining_reviews FROM reviews;

-- Show any remaining reviews (should be empty for a clean system)
SELECT 
  r.id,
  r.rating,
  r.review_text,
  r.created_at,
  p_talent.name as talent_name,
  p_user.name as user_name
FROM reviews r
LEFT JOIN profiles p_talent ON r.talent_id = p_talent.id
LEFT JOIN profiles p_user ON r.user_id = p_user.id
ORDER BY r.created_at DESC;
