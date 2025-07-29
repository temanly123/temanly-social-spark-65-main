-- Fix database issues and add sample talent data
-- This migration addresses the "operator does not exist: text -> unknown" error
-- and ensures we have sample talent data for testing

-- 1. Fix profile_data column type issues
DO $$ 
BEGIN
    -- Ensure profile_data column exists and is JSONB type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='profile_data') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_data JSONB DEFAULT '{}';
    ELSE
        -- Fix the column type if it's not JSONB
        ALTER TABLE public.profiles 
        ALTER COLUMN profile_data TYPE JSONB USING 
          CASE 
            WHEN profile_data IS NULL THEN '{}'::JSONB
            WHEN profile_data::TEXT = '' THEN '{}'::JSONB
            WHEN profile_data::TEXT = 'null' THEN '{}'::JSONB
            ELSE 
              CASE 
                WHEN profile_data::TEXT ~ '^{.*}$' THEN profile_data::JSONB
                ELSE '{}'::JSONB
              END
          END;
    END IF;
    
    -- Set default for existing NULL values
    UPDATE public.profiles SET profile_data = '{}' WHERE profile_data IS NULL;
    
    -- Set NOT NULL constraint with default
    ALTER TABLE public.profiles ALTER COLUMN profile_data SET DEFAULT '{}';
    ALTER TABLE public.profiles ALTER COLUMN profile_data SET NOT NULL;
END $$;

-- 2. Ensure all required columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS zodiac TEXT,
ADD COLUMN IF NOT EXISTS love_language TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS available_services TEXT[],
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured_talent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_newcomer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS rent_lover_rate DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- 3. Clear any existing problematic data and insert fresh sample talent data
DELETE FROM public.profiles WHERE user_type = 'companion';

-- 4. Insert sample verified talent data
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
  '{"specialties": ["Conversation", "Entertainment", "Cultural Events"], "experience": "Professional companion with 2+ years experience", "languages": ["Bahasa Indonesia", "English"], "education": "University Graduate - Communication", "hobbies": ["Photography", "Traveling", "Reading"], "personality_traits": ["Friendly", "Outgoing", "Professional", "Empathetic"], "favorite_activities": ["Fine Dining", "Art Galleries", "Live Music"], "social_media": {"instagram": "@maya_companion", "facebook": "Maya Sari Dewi"}}'::JSONB,
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
  '{"specialties": ["Cultural Events", "Fine Dining", "Business Events"], "experience": "Elite companion with 3+ years experience in high-end events", "languages": ["Bahasa Indonesia", "English", "Mandarin"], "education": "Masters Degree - Arts & Culture", "hobbies": ["Classical Music", "Wine Tasting", "Literature"], "personality_traits": ["Elegant", "Sophisticated", "Intelligent", "Charming"], "favorite_activities": ["Opera", "Fine Dining", "Art Exhibitions"], "social_media": {"instagram": "@rina_elite", "facebook": "Rina Putri Maharani"}}'::JSONB,
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
  ARRAY['Nightlife', 'Picnic Date', 'Shopping'],
  ARRAY['chat', 'call', 'video_call', 'offline_date', 'party_buddy'],
  true,
  false,
  true,
  'fresh',
  65000,
  4.6,
  12,
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
  '{"specialties": ["Party Companion", "Adventure Activities", "Casual Dating"], "experience": "New companion with natural charm and enthusiasm", "languages": ["Bahasa Indonesia", "English"], "education": "University Student - Psychology", "hobbies": ["Dancing", "Hiking", "Social Media"], "personality_traits": ["Energetic", "Fun-loving", "Spontaneous", "Cheerful"], "favorite_activities": ["Clubbing", "Beach Activities", "Food Adventures"], "social_media": {"instagram": "@sari_fun", "facebook": "Sari Indah Permata"}}'::JSONB,
  NOW() - INTERVAL '2 months',
  NOW()
),
(
  gen_random_uuid(),
  'dina.cantik@temanly.com',
  'Dina Cantik',
  'Dina Cantik Lestari',
  '+6281234567893',
  'companion',
  'verified',
  'active',
  25,
  'Medan',
  'Medan',
  'Warm and caring companion with excellent listening skills. Perfect for meaningful conversations and emotional support.',
  'Cancer',
  'Acts of Service',
  ARRAY['Coffee Chat', 'Movie Date', 'Picnic Date'],
  ARRAY['chat', 'call', 'video_call', 'offline_date'],
  true,
  false,
  false,
  'elite',
  70000,
  4.7,
  38,
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  '{"specialties": ["Emotional Support", "Deep Conversations", "Relaxation"], "experience": "Caring companion with focus on emotional well-being", "languages": ["Bahasa Indonesia", "English"], "education": "Psychology Graduate", "hobbies": ["Reading", "Meditation", "Cooking"], "personality_traits": ["Caring", "Empathetic", "Patient", "Understanding"], "favorite_activities": ["Quiet Cafes", "Nature Walks", "Home Cooking"], "social_media": {"instagram": "@dina_caring", "facebook": "Dina Cantik Lestari"}}'::JSONB,
  NOW() - INTERVAL '6 months',
  NOW()
),
(
  gen_random_uuid(),
  'luna.manis@temanly.com',
  'Luna Manis',
  'Luna Manis Sari',
  '+6281234567894',
  'companion',
  'verified',
  'active',
  23,
  'Yogyakarta',
  'Yogyakarta',
  'Creative and artistic companion who loves cultural experiences and creative activities. Great for art events and cultural exploration.',
  'Pisces',
  'Quality Time',
  ARRAY['Museum Date', 'Cultural Events', 'Coffee Chat'],
  ARRAY['chat', 'call', 'video_call', 'offline_date', 'party_buddy'],
  true,
  false,
  false,
  'fresh',
  68000,
  4.5,
  18,
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
  '{"specialties": ["Art & Culture", "Creative Activities", "Cultural Tours"], "experience": "Artist and cultural enthusiast", "languages": ["Bahasa Indonesia", "English", "Javanese"], "education": "Fine Arts Graduate", "hobbies": ["Painting", "Traditional Dance", "Poetry"], "personality_traits": ["Creative", "Artistic", "Thoughtful", "Inspiring"], "favorite_activities": ["Art Galleries", "Cultural Festivals", "Creative Workshops"], "social_media": {"instagram": "@luna_artist", "facebook": "Luna Manis Sari"}}'::JSONB,
  NOW() - INTERVAL '4 months',
  NOW()
);

-- 5. Refresh any materialized views or update statistics
ANALYZE public.profiles;

-- 6. Ensure RLS policies allow public access to verified companions
DROP POLICY IF EXISTS "Public can view verified companions" ON public.profiles;
CREATE POLICY "Public can view verified companions" ON public.profiles
FOR SELECT USING (
  user_type = 'companion' 
  AND verification_status = 'verified' 
  AND status = 'active'
);
