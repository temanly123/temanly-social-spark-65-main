-- Add missing profile_data column if not exists to store comprehensive talent registration data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_data jsonb;

-- Add indexes for better performance on talent searches
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_data ON profiles USING gin(profile_data);

-- Update any existing companion profiles to have proper structure
UPDATE profiles 
SET profile_data = COALESCE(profile_data, '{}')
WHERE user_type = 'companion' AND profile_data IS NULL;