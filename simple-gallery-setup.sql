-- Simple Gallery Setup
-- Run this in Supabase SQL Editor

-- 1. Create talent_gallery table
CREATE TABLE IF NOT EXISTS talent_gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE talent_gallery ENABLE ROW LEVEL SECURITY;

-- 3. Create simple policies
DROP POLICY IF EXISTS "Anyone can view gallery" ON talent_gallery;
DROP POLICY IF EXISTS "Users can manage own gallery" ON talent_gallery;

CREATE POLICY "Anyone can view gallery" ON talent_gallery
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own gallery" ON talent_gallery
    FOR ALL TO authenticated
    USING (talent_id = auth.uid());

-- 4. Grant permissions
GRANT ALL ON talent_gallery TO authenticated;
GRANT ALL ON talent_gallery TO service_role;
GRANT SELECT ON talent_gallery TO anon;

-- 5. Test the setup
SELECT 'Gallery table created successfully!' as status;
SELECT COUNT(*) as existing_entries FROM talent_gallery;
