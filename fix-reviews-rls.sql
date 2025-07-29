-- Fix reviews table RLS policies to match actual schema
-- The reviews table uses reviewer_id, reviewee_id, comment fields

-- Drop existing policies that might be using wrong field names
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Talents can view their reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

-- Create correct policies using actual field names
CREATE POLICY "Users can create reviews for their bookings" ON reviews
FOR INSERT WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can view verified reviews" ON reviews
FOR SELECT USING (is_verified = true);

CREATE POLICY "Users can view their own reviews" ON reviews
FOR SELECT USING (reviewer_id = auth.uid());

CREATE POLICY "Talents can view their reviews" ON reviews
FOR SELECT USING (reviewee_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" ON reviews
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

-- Ensure RLS is enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON reviews TO authenticated;
GRANT ALL ON reviews TO service_role;
