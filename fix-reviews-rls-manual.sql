-- Fix reviews table RLS policies for rating functionality
-- Run this in Supabase SQL Editor

-- 1. Check current reviews table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
ORDER BY ordinal_position;

-- 2. Check current RLS policies for reviews
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

-- 3. Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Talents can view their reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view verified reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view their own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view verified reviews" ON reviews;

-- 4. Create correct policies using actual field names (reviewer_id, reviewee_id, comment)
CREATE POLICY "Users can create reviews" ON reviews
FOR INSERT TO authenticated
WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Public can view verified reviews" ON reviews
FOR SELECT TO authenticated, anon
USING (is_verified = true);

CREATE POLICY "Users can view own reviews" ON reviews
FOR SELECT TO authenticated
USING (reviewer_id = auth.uid());

CREATE POLICY "Talents can view their reviews" ON reviews
FOR SELECT TO authenticated
USING (reviewee_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" ON reviews
FOR ALL TO authenticated
USING (
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

-- 5. Ensure RLS is enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON reviews TO service_role;

-- 7. Test the policies
SELECT 'Reviews RLS policies updated successfully!' as status;
