-- SQL to create a talent profile for existing user
-- Replace 'your-email@example.com' with your actual email address

INSERT INTO public.profiles (
  email,
  name,
  user_type,
  status,
  verification_status,
  phone,
  age,
  location,
  bio,
  created_at,
  updated_at
) VALUES (
  'amandasoenoko@gmail.com', -- Replace with your email
  'Amanda Angela Soenoko',    -- Replace with your name
  'companion',
  'active',
  'pending',
  '+62812345678',            -- Replace with your phone
  25,                        -- Replace with your age
  'Jakarta',                 -- Replace with your location
  'New talent on Temanly platform',
  NOW(),
  NOW()
);

-- Verify the profile was created
SELECT * FROM public.profiles WHERE email = 'amandasoenoko@gmail.com';
