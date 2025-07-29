-- Update Amanda's rating to 0 since she has no real reviews
UPDATE profiles 
SET 
  rating = 0,
  total_orders = 0,
  updated_at = NOW()
WHERE id = '9153feb4-6b65-4011-b894-f7268b3abe44'
  AND name = 'Amanda Angela Soenoko';

-- Verify the update
SELECT 
  id,
  name,
  rating,
  total_orders,
  updated_at
FROM profiles 
WHERE id = '9153feb4-6b65-4011-b894-f7268b3abe44';
