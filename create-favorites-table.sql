-- Create user_favorites table for production
-- Run this manually in your Supabase SQL editor

-- 1. Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    talent_id UUID NOT NULL,
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

-- 5. Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.user_favorites TO authenticated;

-- Success message
SELECT '✅ Favorites table created successfully!' as status;
