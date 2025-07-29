-- Fix Gallery Issues and Add Profile Photos
-- This script ensures the talent_gallery table exists and adds profile photos to galleries

-- 1. Check current state
SELECT 'Current state check:' as step;
SELECT 'Profiles with photos:' as info, COUNT(*) as count 
FROM profiles 
WHERE profile_image IS NOT NULL AND user_type = 'companion';

SELECT 'Existing gallery entries:' as info, COUNT(*) as count 
FROM talent_gallery;

-- 2. Ensure talent_gallery table exists with correct structure
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

-- 3. Enable RLS on talent_gallery
ALTER TABLE talent_gallery ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for talent_gallery
DROP POLICY IF EXISTS "Public can view talent gallery" ON talent_gallery;
DROP POLICY IF EXISTS "Talents can manage their gallery" ON talent_gallery;
DROP POLICY IF EXISTS "Admins can manage all galleries" ON talent_gallery;

CREATE POLICY "Public can view talent gallery" ON talent_gallery
    FOR SELECT USING (true);

CREATE POLICY "Talents can manage their gallery" ON talent_gallery
    FOR ALL TO authenticated
    USING (talent_id = auth.uid());

CREATE POLICY "Admins can manage all galleries" ON talent_gallery
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON talent_gallery TO authenticated;
GRANT ALL ON talent_gallery TO service_role;
GRANT SELECT ON talent_gallery TO anon;

-- 5. Add profile photos to gallery for existing talents
INSERT INTO talent_gallery (talent_id, image_url, caption, is_featured, display_order)
SELECT 
    id as talent_id,
    profile_image as image_url,
    'Profile Photo' as caption,
    true as is_featured,
    0 as display_order
FROM profiles 
WHERE user_type = 'companion' 
AND profile_image IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM talent_gallery 
    WHERE talent_id = profiles.id 
    AND image_url = profiles.profile_image
);

-- 6. Show results
SELECT 'Results after setup:' as step;

SELECT 'Talents with profile photos:' as info;
SELECT 
    p.id,
    p.name,
    p.profile_image IS NOT NULL as has_profile_image,
    COUNT(tg.id) as gallery_count
FROM profiles p
LEFT JOIN talent_gallery tg ON p.id = tg.talent_id
WHERE p.user_type = 'companion'
GROUP BY p.id, p.name, p.profile_image
ORDER BY p.name;

SELECT 'Gallery entries by talent:' as info;
SELECT 
    tg.talent_id,
    p.name as talent_name,
    COUNT(tg.id) as photo_count,
    STRING_AGG(tg.caption, ', ') as captions
FROM talent_gallery tg
JOIN profiles p ON tg.talent_id = p.id
GROUP BY tg.talent_id, p.name
ORDER BY p.name;

SELECT 'Total gallery statistics:' as info;
SELECT 
    COUNT(*) as total_gallery_photos,
    COUNT(DISTINCT talent_id) as talents_with_photos,
    AVG(photos_per_talent) as avg_photos_per_talent
FROM (
    SELECT talent_id, COUNT(*) as photos_per_talent
    FROM talent_gallery
    GROUP BY talent_id
) stats;

SELECT '✅ SUCCESS: Gallery setup completed!' as status;
