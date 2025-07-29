-- Manual cleanup script for duplicate emails
-- Run this in your Supabase SQL Editor to fix the amandasoenoko@gmail.com duplicate

-- 1. First, let's see what we have
SELECT 
    id,
    email,
    name,
    user_type,
    verification_status,
    created_at,
    phone
FROM public.profiles 
WHERE email = 'amandasoenoko@gmail.com'
ORDER BY created_at;

-- 2. Check if there are any bookings or transactions tied to these accounts
SELECT 
    'bookings' as table_name,
    COUNT(*) as count,
    user_id
FROM public.bookings 
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email = 'amandasoenoko@gmail.com'
)
GROUP BY user_id

UNION ALL

SELECT 
    'transactions' as table_name,
    COUNT(*) as count,
    user_id::text
FROM public.transactions 
WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email = 'amandasoenoko@gmail.com'
)
GROUP BY user_id

UNION ALL

SELECT 
    'transactions_companion' as table_name,
    COUNT(*) as count,
    companion_id::text
FROM public.transactions 
WHERE companion_id IN (
    SELECT id FROM public.profiles WHERE email = 'amandasoenoko@gmail.com'
)
GROUP BY companion_id;

-- 3. Clean up the duplicate - Keep the talent record, remove the user record
-- (Talents have more valuable data like verification documents, rates, etc.)

-- First, identify which record to keep and which to remove
WITH duplicate_analysis AS (
    SELECT 
        id,
        email,
        user_type,
        verification_status,
        created_at,
        CASE 
            WHEN user_type = 'companion' THEN 1  -- Keep talent
            WHEN user_type = 'user' THEN 2       -- Remove user
            ELSE 3                               -- Keep others
        END as priority
    FROM public.profiles 
    WHERE email = 'amandasoenoko@gmail.com'
),
records_to_remove AS (
    SELECT id 
    FROM duplicate_analysis 
    WHERE priority = 2  -- User records
)
-- Delete the user record from profiles
DELETE FROM public.profiles 
WHERE id IN (SELECT id FROM records_to_remove);

-- 4. Also clean up from auth.users table
WITH user_records AS (
    SELECT au.id 
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE au.email = 'amandasoenoko@gmail.com' 
    AND p.id IS NULL  -- Profile was deleted above
)
DELETE FROM auth.users 
WHERE id IN (SELECT id FROM user_records);

-- 5. Verify the cleanup
SELECT 
    'After cleanup' as status,
    COUNT(*) as remaining_records
FROM public.profiles 
WHERE email = 'amandasoenoko@gmail.com';

-- 6. Show the remaining record
SELECT 
    id,
    email,
    name,
    user_type,
    verification_status,
    created_at
FROM public.profiles 
WHERE email = 'amandasoenoko@gmail.com';

-- 7. Add a unique constraint to prevent future duplicates
-- (Only run this if you have admin access to alter table structure)
/*
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);
*/

-- 8. Create a function to check for any remaining duplicates
CREATE OR REPLACE FUNCTION check_duplicate_emails()
RETURNS TABLE (
    email TEXT,
    duplicate_count BIGINT,
    user_types TEXT[]
)
LANGUAGE SQL
AS $$
    SELECT 
        p.email,
        COUNT(*) as duplicate_count,
        ARRAY_AGG(DISTINCT p.user_type::TEXT) as user_types
    FROM public.profiles p
    WHERE p.email IS NOT NULL
    GROUP BY p.email
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC;
$$;

-- Run the check
SELECT * FROM check_duplicate_emails();
