-- Comprehensive Temanly Booking System Migration
-- This migration creates the complete booking system with all Temanly business rules

-- 1. Create additional enums for the comprehensive system
DO $$ 
BEGIN
    -- Add new service types if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'multiple_services' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_type')) THEN
        ALTER TYPE service_type ADD VALUE 'multiple_services';
    END IF;
END $$;

-- 2. Create interests table for talent interests
CREATE TABLE IF NOT EXISTS public.talent_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- 'date_activity', 'hobby', 'sport', etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default interests
INSERT INTO public.talent_interests (name, category, description) VALUES
('Sushi Date', 'date_activity', 'Enjoying sushi together'),
('Museum Date', 'date_activity', 'Exploring museums and art galleries'),
('Picnic Date', 'date_activity', 'Outdoor picnic experience'),
('Movie Date', 'date_activity', 'Cinema and movie watching'),
('Golf', 'sport', 'Golf playing and lessons'),
('Tennis', 'sport', 'Tennis playing and coaching'),
('Coffee Chat', 'casual', 'Casual coffee conversations'),
('Shopping', 'lifestyle', 'Shopping companion'),
('Nightlife', 'entertainment', 'Party and nightlife companion'),
('Cultural Events', 'culture', 'Cultural events and festivals')
ON CONFLICT (name) DO NOTHING;

-- 3. Create talent_profile_interests junction table
CREATE TABLE IF NOT EXISTS public.talent_profile_interests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES talent_interests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(talent_id, interest_id)
);

-- 4. Create service_configurations table for talent service availability
CREATE TABLE IF NOT EXISTS public.service_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    is_available BOOLEAN DEFAULT true,
    custom_rate DECIMAL(12,2), -- Custom rate if different from default
    max_duration INTEGER, -- Max duration for calls/video calls per day
    description TEXT, -- Custom service description
    terms TEXT, -- Special terms for this service
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(talent_id, service_type)
);

-- 5. Extend availability_slots table with more detailed scheduling
ALTER TABLE public.availability_slots 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_bookings_per_slot INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. Create cities table for location filtering
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    province TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert major Indonesian cities
INSERT INTO public.cities (name, province) VALUES
('Jakarta', 'DKI Jakarta'),
('Surabaya', 'Jawa Timur'),
('Bandung', 'Jawa Barat'),
('Medan', 'Sumatera Utara'),
('Semarang', 'Jawa Tengah'),
('Makassar', 'Sulawesi Selatan'),
('Palembang', 'Sumatera Selatan'),
('Tangerang', 'Banten'),
('Depok', 'Jawa Barat'),
('Bekasi', 'Jawa Barat')
ON CONFLICT (name) DO NOTHING;

-- 7. Add new columns to profiles table for comprehensive talent data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS zodiac TEXT,
ADD COLUMN IF NOT EXISTS love_language TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[], -- Array of interest names
ADD COLUMN IF NOT EXISTS available_services TEXT[], -- Array of available service types
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true, -- Talent availability status
ADD COLUMN IF NOT EXISTS featured_talent BOOLEAN DEFAULT false, -- For homepage featured section
ADD COLUMN IF NOT EXISTS is_newcomer BOOLEAN DEFAULT true, -- For homepage newcomers section
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id),
ADD COLUMN IF NOT EXISTS rent_lover_rate DECIMAL(12,2), -- Custom rent a lover rate
ADD COLUMN IF NOT EXISTS rent_lover_description TEXT, -- Custom rent a lover package description
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0, -- Track total completed orders
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0, -- Average rating
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'; -- Ensure profile_data exists as JSONB

-- Fix profile_data column type if it exists but is wrong type
DO $$
BEGIN
    -- Check if profile_data exists and fix its type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_data') THEN
        -- Ensure it's JSONB type
        ALTER TABLE public.profiles
        ALTER COLUMN profile_data TYPE JSONB USING
          CASE
            WHEN profile_data IS NULL THEN '{}'::JSONB
            WHEN profile_data::TEXT = '' THEN '{}'::JSONB
            ELSE profile_data::JSONB
          END;

        -- Set default for existing NULL values
        UPDATE public.profiles SET profile_data = '{}' WHERE profile_data IS NULL;
    END IF;
END $$;

-- 8. Extend bookings table for comprehensive booking data
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS selected_services JSONB, -- Array of selected services with details
ADD COLUMN IF NOT EXISTS date_plan TEXT, -- Detailed date plan for offline dates
ADD COLUMN IF NOT EXISTS transport_fee DECIMAL(12,2) DEFAULT 0, -- Transport fee for offline dates
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(12,2) DEFAULT 0, -- 10% platform fee
ADD COLUMN IF NOT EXISTS talent_earnings DECIMAL(12,2) DEFAULT 0, -- Talent earnings after commission
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 20.0, -- Commission rate based on talent level
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT false, -- If user verification is required
ADD COLUMN IF NOT EXISTS whatsapp_notification_sent BOOLEAN DEFAULT false, -- Track WhatsApp notifications
ADD COLUMN IF NOT EXISTS contact_initiated BOOLEAN DEFAULT false, -- Track if talent contacted user
ADD COLUMN IF NOT EXISTS review_requested BOOLEAN DEFAULT false; -- Track if review request sent

-- 9. Create booking_services junction table for multiple service bookings
CREATE TABLE IF NOT EXISTS public.booking_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    service_name TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 1,
    rate DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create reviews table for rating system
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT false, -- Admin verification
    admin_notes TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create talent_reviews table (separate from user reviews)
CREATE TABLE IF NOT EXISTS public.talent_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT false,
    admin_notes TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create notification_logs table for WhatsApp tracking
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'booking_confirmed', 'contact_info', 'review_request'
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    response_data JSONB,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Create service_rates table for dynamic pricing
CREATE TABLE IF NOT EXISTS public.service_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_type service_type NOT NULL UNIQUE,
    base_rate DECIMAL(12,2) NOT NULL,
    additional_rate DECIMAL(12,2), -- For services with additional hourly rates
    unit TEXT NOT NULL, -- 'day', 'hour', '3 hours', 'event'
    description TEXT,
    transport_percentage DECIMAL(5,2) DEFAULT 20.0, -- Transport fee percentage for offline dates
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default service rates based on Temanly pricing
INSERT INTO public.service_rates (service_type, base_rate, additional_rate, unit, description, transport_percentage) VALUES
('chat', 25000, NULL, 'day', 'Chat service for one day', 0),
('call', 40000, 40000, 'hour', 'Voice call service per hour', 0),
('video_call', 65000, 65000, 'hour', 'Video call service per hour', 0),
('offline_date', 285000, 90000, '3 hours', 'Offline date for 3 hours, additional 90k per extra hour', 20.0),
('party_buddy', 1000000, NULL, 'event', 'Party buddy for one event (8 PM - 4 AM)', 0),
('rent_lover', 85000, NULL, 'day', 'Rent a lover service (customizable by talent)', 0)
ON CONFLICT (service_type) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    additional_rate = EXCLUDED.additional_rate,
    unit = EXCLUDED.unit,
    description = EXCLUDED.description,
    transport_percentage = EXCLUDED.transport_percentage,
    updated_at = NOW();

-- 14. Create functions for talent level progression
CREATE OR REPLACE FUNCTION public.update_talent_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Update talent level based on completed orders and rating
    UPDATE profiles
    SET talent_level = CASE
        WHEN total_orders >= 100 AND average_rating >= 4.5 AND
             created_at <= NOW() - INTERVAL '6 months' THEN 'vip'::talent_level
        WHEN total_orders >= 30 AND average_rating >= 4.5 THEN 'elite'::talent_level
        ELSE 'fresh'::talent_level
    END,
    is_newcomer = CASE
        WHEN total_orders >= 5 THEN false
        ELSE is_newcomer
    END
    WHERE id = NEW.talent_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for talent level updates
DROP TRIGGER IF EXISTS trigger_update_talent_level ON reviews;
CREATE TRIGGER trigger_update_talent_level
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_talent_level();

-- 15. Create function to calculate commission rates
CREATE OR REPLACE FUNCTION public.get_commission_rate(talent_level_param talent_level)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    RETURN CASE talent_level_param
        WHEN 'fresh' THEN 20.0
        WHEN 'elite' THEN 18.0
        WHEN 'vip' THEN 15.0
        ELSE 20.0
    END;
END;
$$ LANGUAGE plpgsql;

-- 16. Create function to update talent statistics
CREATE OR REPLACE FUNCTION public.update_talent_stats()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_completed INTEGER;
BEGIN
    -- Calculate average rating
    SELECT AVG(rating::DECIMAL), COUNT(*)
    INTO avg_rating, total_completed
    FROM reviews
    WHERE talent_id = NEW.talent_id AND is_verified = true;

    -- Update talent profile
    UPDATE profiles
    SET
        average_rating = COALESCE(avg_rating, 0.0),
        total_orders = COALESCE(total_completed, 0),
        updated_at = NOW()
    WHERE id = NEW.talent_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for talent stats updates
DROP TRIGGER IF EXISTS trigger_update_talent_stats ON reviews;
CREATE TRIGGER trigger_update_talent_stats
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_talent_stats();

-- 17. Create RLS policies for new tables
ALTER TABLE public.talent_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_rates ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY "Public can view talent interests" ON talent_interests FOR SELECT USING (true);
CREATE POLICY "Public can view cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public can view service rates" ON service_rates FOR SELECT USING (true);

-- Talent profile interests policies
CREATE POLICY "Talents can manage their interests" ON talent_profile_interests
FOR ALL USING (talent_id = auth.uid());

CREATE POLICY "Public can view talent interests" ON talent_profile_interests
FOR SELECT USING (true);

-- Service configurations policies
CREATE POLICY "Talents can manage their service configs" ON service_configurations
FOR ALL USING (talent_id = auth.uid());

CREATE POLICY "Public can view service configs" ON service_configurations
FOR SELECT USING (true);

-- Booking services policies
CREATE POLICY "Users can view their booking services" ON booking_services
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_services.booking_id
        AND (bookings.user_id = auth.uid() OR bookings.companion_id = auth.uid())
    )
);

-- Reviews policies
CREATE POLICY "Users can create reviews for their bookings" ON reviews
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view reviews" ON reviews
FOR SELECT USING (is_verified = true);

CREATE POLICY "Talents can view their reviews" ON reviews
FOR SELECT USING (talent_id = auth.uid());

-- Talent reviews policies (reviews by talents about users)
CREATE POLICY "Talents can create reviews for their bookings" ON talent_reviews
FOR INSERT WITH CHECK (talent_id = auth.uid());

CREATE POLICY "Public can view verified talent reviews" ON talent_reviews
FOR SELECT USING (is_verified = true);

-- Notification logs policies
CREATE POLICY "Users can view their notifications" ON notification_logs
FOR SELECT USING (user_id = auth.uid() OR talent_id = auth.uid());

-- Admin policies for all tables
CREATE POLICY "Admins can manage all data" ON talent_interests FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage talent interests" ON talent_profile_interests FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage service configs" ON service_configurations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage cities" ON cities FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage booking services" ON booking_services FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage reviews" ON reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage talent reviews" ON talent_reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage notifications" ON notification_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Admins can manage service rates" ON service_rates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 18. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_talent_profile_interests_talent_id ON talent_profile_interests(talent_id);
CREATE INDEX IF NOT EXISTS idx_service_configurations_talent_id ON service_configurations(talent_id);
CREATE INDEX IF NOT EXISTS idx_service_configurations_service_type ON service_configurations(service_type);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_talent_id ON reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_talent_reviews_talent_id ON talent_reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_booking_id ON notification_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_available ON profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_profiles_featured_talent ON profiles(featured_talent);
CREATE INDEX IF NOT EXISTS idx_profiles_is_newcomer ON profiles(is_newcomer);
CREATE INDEX IF NOT EXISTS idx_profiles_talent_level ON profiles(talent_level);
CREATE INDEX IF NOT EXISTS idx_profiles_average_rating ON profiles(average_rating);

-- 19. Grant necessary permissions
GRANT ALL ON public.talent_interests TO authenticated, service_role;
GRANT ALL ON public.talent_profile_interests TO authenticated, service_role;
GRANT ALL ON public.service_configurations TO authenticated, service_role;
GRANT ALL ON public.cities TO authenticated, service_role;
GRANT ALL ON public.booking_services TO authenticated, service_role;
GRANT ALL ON public.reviews TO authenticated, service_role;
GRANT ALL ON public.talent_reviews TO authenticated, service_role;
GRANT ALL ON public.notification_logs TO authenticated, service_role;
GRANT ALL ON public.service_rates TO authenticated, service_role;

-- 20. Insert sample verified talent data for testing
INSERT INTO public.profiles (
  id, email, name, full_name, phone, user_type, verification_status, status,
  age, location, city, bio, zodiac, love_language,
  interests, available_services, is_available, featured_talent, is_newcomer,
  talent_level, rent_lover_rate, average_rating, total_orders, profile_image,
  profile_data, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'maya.sari@temanly.com',
  'Maya Sari',
  'Maya Sari Dewi',
  '+6281234567890',
  'companion',
  'verified',
  'active',
  24,
  'Jakarta',
  'Jakarta',
  'Friendly and outgoing companion who loves exploring the city and trying new experiences. Perfect for dates, events, and meaningful conversations.',
  'Gemini',
  'Quality Time',
  ARRAY['Sushi Date', 'Museum Date', 'Coffee Chat', 'Shopping'],
  ARRAY['chat', 'call', 'video_call', 'offline_date', 'party_buddy'],
  true,
  true,
  false,
  'elite',
  75000,
  4.8,
  45,
  'https://images.unsplash.com/photo-1494790108755-2616b9c5e8e1?w=400&h=400&fit=crop&crop=face',
  jsonb_build_object(
    'specialties', ARRAY['Conversation', 'Entertainment', 'Cultural Events'],
    'experience', 'Professional companion with 2+ years experience',
    'languages', ARRAY['Bahasa Indonesia', 'English'],
    'education', 'University Graduate - Communication',
    'hobbies', ARRAY['Photography', 'Traveling', 'Reading'],
    'personality_traits', ARRAY['Friendly', 'Outgoing', 'Professional', 'Empathetic'],
    'favorite_activities', ARRAY['Fine Dining', 'Art Galleries', 'Live Music'],
    'social_media', jsonb_build_object(
      'instagram', '@maya_companion',
      'facebook', 'Maya Sari Dewi'
    )
  ),
  NOW() - INTERVAL '8 months',
  NOW()
),
(
  gen_random_uuid(),
  'rina.putri@temanly.com',
  'Rina Putri',
  'Rina Putri Maharani',
  '+6281234567891',
  'companion',
  'verified',
  'active',
  26,
  'Bandung',
  'Bandung',
  'Elegant and sophisticated companion with a passion for arts and culture. Great for formal events and intellectual conversations.',
  'Libra',
  'Words of Affirmation',
  ARRAY['Museum Date', 'Cultural Events', 'Coffee Chat'],
  ARRAY['chat', 'call', 'video_call', 'offline_date', 'party_buddy', 'rent_lover'],
  true,
  true,
  false,
  'vip',
  95000,
  4.9,
  120,
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
  jsonb_build_object(
    'specialties', ARRAY['Cultural Events', 'Fine Dining', 'Business Events'],
    'experience', 'Elite companion with 3+ years experience in high-end events',
    'languages', ARRAY['Bahasa Indonesia', 'English', 'Mandarin'],
    'education', 'Masters Degree - Arts & Culture',
    'hobbies', ARRAY['Classical Music', 'Wine Tasting', 'Literature'],
    'personality_traits', ARRAY['Elegant', 'Sophisticated', 'Intelligent', 'Charming'],
    'favorite_activities', ARRAY['Opera', 'Fine Dining', 'Art Exhibitions'],
    'social_media', jsonb_build_object(
      'instagram', '@rina_elite',
      'facebook', 'Rina Putri Maharani'
    )
  ),
  NOW() - INTERVAL '2 years',
  NOW()
),
(
  gen_random_uuid(),
  'sari.indah@temanly.com',
  'Sari Indah',
  'Sari Indah Permata',
  '+6281234567892',
  'companion',
  'verified',
  'active',
  22,
  'Surabaya',
  'Surabaya',
  'Energetic and fun-loving companion who brings joy to every occasion. Perfect for parties, casual dates, and adventure activities.',
  'Leo',
  'Physical Touch',
  ARRAY['Party Buddy', 'Nightlife', 'Picnic Date', 'Shopping'],
  ARRAY['chat', 'call', 'video_call', 'offline_date', 'party_buddy'],
  true,
  false,
  true,
  'fresh',
  65000,
  4.6,
  12,
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  jsonb_build_object(
    'specialties', ARRAY['Party Companion', 'Adventure Activities', 'Casual Dating'],
    'experience', 'New companion with natural charm and enthusiasm',
    'languages', ARRAY['Bahasa Indonesia', 'English'],
    'education', 'University Student - Psychology',
    'hobbies', ARRAY['Dancing', 'Hiking', 'Social Media'],
    'personality_traits', ARRAY['Energetic', 'Fun-loving', 'Spontaneous', 'Cheerful'],
    'favorite_activities', ARRAY['Clubbing', 'Beach Activities', 'Food Adventures'],
    'social_media', jsonb_build_object(
      'instagram', '@sari_fun',
      'facebook', 'Sari Indah Permata'
    )
  ),
  NOW() - INTERVAL '2 months',
  NOW()
)
ON CONFLICT (email) DO NOTHING;
