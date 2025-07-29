-- Create favorites system for users to save their favorite talents
-- This migration creates the user_favorites table and related functionality

-- 1. Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user can only favorite a talent once
    UNIQUE(user_id, talent_id)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_talent_id ON user_favorites(talent_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. Create function to get user's favorite count
CREATE OR REPLACE FUNCTION get_user_favorite_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.user_favorites
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to check if talent is favorited by user
CREATE OR REPLACE FUNCTION is_talent_favorited(user_uuid UUID, talent_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_favorites
        WHERE user_id = user_uuid AND talent_id = talent_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_favorite(user_uuid UUID, talent_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_favorited BOOLEAN;
BEGIN
    -- Check if already favorited
    SELECT EXISTS (
        SELECT 1 FROM public.user_favorites 
        WHERE user_id = user_uuid AND talent_id = talent_uuid
    ) INTO is_favorited;
    
    IF is_favorited THEN
        -- Remove from favorites
        DELETE FROM public.user_favorites 
        WHERE user_id = user_uuid AND talent_id = talent_uuid;
        RETURN FALSE;
    ELSE
        -- Add to favorites
        INSERT INTO public.user_favorites (user_id, talent_id)
        VALUES (user_uuid, talent_uuid)
        ON CONFLICT (user_id, talent_id) DO NOTHING;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorite_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_talent_favorited(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_favorite(UUID, UUID) TO authenticated;

-- 9. Add some sample data for testing (optional)
-- This will be cleaned up by the cleanup script if needed
INSERT INTO public.user_favorites (user_id, talent_id) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (user_id, talent_id) DO NOTHING;

-- Success message
SELECT '✅ Favorites system created successfully!' as status;
