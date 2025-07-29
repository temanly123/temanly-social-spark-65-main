-- Enhanced Talent Profile Migration
-- This migration adds comprehensive features for robust talent profiles

-- Create talent gallery table for multiple photos
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

-- Create talent achievements table
CREATE TABLE IF NOT EXISTS talent_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create talent availability schedule table
CREATE TABLE IF NOT EXISTS talent_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(talent_id, day_of_week)
);

-- Add new columns to profiles table for enhanced features
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_talent_gallery_talent_id ON talent_gallery(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_gallery_featured ON talent_gallery(talent_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_talent_achievements_talent_id ON talent_achievements(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_availability_talent_id ON talent_availability(talent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_views ON profiles(profile_views);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);

-- Enable RLS on new tables
ALTER TABLE talent_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for talent_gallery
CREATE POLICY "Public can view talent gallery" ON talent_gallery
    FOR SELECT USING (true);

CREATE POLICY "Talents can manage their gallery" ON talent_gallery
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE id = talent_gallery.talent_id 
            AND user_type = 'companion'
        )
    );

CREATE POLICY "Admins can manage all galleries" ON talent_gallery
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE is_admin = true
        )
    );

-- RLS Policies for talent_achievements
CREATE POLICY "Public can view talent achievements" ON talent_achievements
    FOR SELECT USING (true);

CREATE POLICY "Talents can view their achievements" ON talent_achievements
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE id = talent_achievements.talent_id 
            AND user_type = 'companion'
        )
    );

CREATE POLICY "Admins can manage all achievements" ON talent_achievements
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE is_admin = true
        )
    );

-- RLS Policies for talent_availability
CREATE POLICY "Public can view talent availability" ON talent_availability
    FOR SELECT USING (true);

CREATE POLICY "Talents can manage their availability" ON talent_availability
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE id = talent_availability.talent_id 
            AND user_type = 'companion'
        )
    );

CREATE POLICY "Admins can manage all availability" ON talent_availability
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles 
            WHERE is_admin = true
        )
    );

-- Function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_active when profile is updated
DROP TRIGGER IF EXISTS trigger_update_last_active ON profiles;
CREATE TRIGGER trigger_update_last_active
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_active();

-- Function to automatically create default availability schedule for new talents
CREATE OR REPLACE FUNCTION create_default_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create for companions (talents)
    IF NEW.user_type = 'companion' THEN
        -- Create default 9 AM to 9 PM availability for all days
        INSERT INTO talent_availability (talent_id, day_of_week, start_time, end_time, is_available)
        VALUES 
            (NEW.id, 1, '09:00', '21:00', true), -- Monday
            (NEW.id, 2, '09:00', '21:00', true), -- Tuesday
            (NEW.id, 3, '09:00', '21:00', true), -- Wednesday
            (NEW.id, 4, '09:00', '21:00', true), -- Thursday
            (NEW.id, 5, '09:00', '21:00', true), -- Friday
            (NEW.id, 6, '10:00', '22:00', true), -- Saturday
            (NEW.id, 7, '10:00', '20:00', true); -- Sunday
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default availability for new talents
DROP TRIGGER IF EXISTS trigger_create_default_availability ON profiles;
CREATE TRIGGER trigger_create_default_availability
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_availability();

-- Insert some sample gallery images for existing talents
INSERT INTO talent_gallery (talent_id, image_url, caption, is_featured, display_order)
SELECT 
    id,
    profile_image,
    'Profile photo',
    true,
    1
FROM profiles 
WHERE user_type = 'companion' 
AND profile_image IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM talent_gallery WHERE talent_id = profiles.id
);

-- Insert some sample achievements for VIP and Elite talents
INSERT INTO talent_achievements (talent_id, title, description, icon)
SELECT 
    id,
    CASE 
        WHEN talent_level = 'vip' THEN 'VIP Status Achieved'
        WHEN talent_level = 'elite' THEN 'Elite Status Achieved'
        ELSE 'Welcome to Temanly'
    END,
    CASE 
        WHEN talent_level = 'vip' THEN 'Reached VIP level with exceptional service'
        WHEN talent_level = 'elite' THEN 'Achieved Elite status through quality service'
        ELSE 'Successfully joined the Temanly platform'
    END,
    CASE 
        WHEN talent_level = 'vip' THEN 'crown'
        WHEN talent_level = 'elite' THEN 'star'
        ELSE 'award'
    END
FROM profiles 
WHERE user_type = 'companion'
AND NOT EXISTS (
    SELECT 1 FROM talent_achievements WHERE talent_id = profiles.id
);

-- Update profile_data with sample data for existing talents
UPDATE profiles 
SET profile_data = jsonb_build_object(
    'specialties', ARRAY['Conversation', 'Entertainment'],
    'experience', 'Professional companion with excellent communication skills',
    'languages', ARRAY['Bahasa Indonesia', 'English'],
    'education', 'University Graduate',
    'hobbies', ARRAY['Reading', 'Music', 'Travel'],
    'personality_traits', ARRAY['Friendly', 'Outgoing', 'Professional'],
    'favorite_activities', ARRAY['Dining', 'Movies', 'Sightseeing'],
    'social_media', jsonb_build_object(
        'instagram', '@talent_' || LOWER(REPLACE(name, ' ', '_')),
        'facebook', name
    )
)
WHERE user_type = 'companion' 
AND (profile_data IS NULL OR profile_data = '{}');

-- Create a view for comprehensive talent profiles
CREATE OR REPLACE VIEW talent_profiles_comprehensive AS
SELECT 
    p.*,
    c.name as city_name,
    COALESCE(
        (SELECT COUNT(*) FROM talent_gallery WHERE talent_id = p.id), 
        0
    ) as gallery_count,
    COALESCE(
        (SELECT COUNT(*) FROM talent_achievements WHERE talent_id = p.id), 
        0
    ) as achievements_count,
    COALESCE(
        (SELECT COUNT(*) FROM reviews WHERE talent_id = p.id AND is_verified = true), 
        0
    ) as verified_reviews_count,
    COALESCE(p.average_rating, 0) as rating,
    COALESCE(p.total_orders, 0) as completed_bookings
FROM profiles p
LEFT JOIN cities c ON p.city_id = c.id
WHERE p.user_type = 'companion'
AND p.verification_status = 'verified';

-- Grant necessary permissions
GRANT SELECT ON talent_profiles_comprehensive TO anon, authenticated;
GRANT ALL ON talent_gallery TO authenticated;
GRANT ALL ON talent_achievements TO authenticated;
GRANT ALL ON talent_availability TO authenticated;
