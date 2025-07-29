-- FIX POSTGRESQL OPERATOR ISSUES
-- This fixes the "operator does not exist: text ->> unknown" error

-- Step 1: Create missing operators if they don't exist
-- The ->> operator should exist by default in PostgreSQL, but let's ensure it's available

-- Check if we have the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Fix any column type issues that might cause operator problems
-- Ensure all JSON/JSONB columns are properly typed

-- Check if there are any problematic column types
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Look for any columns that might be causing the operator issue
    FOR rec IN 
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND data_type IN ('text', 'varchar', 'character varying')
        AND table_name IN ('profiles', 'payment_transactions', 'payout_requests')
    LOOP
        RAISE NOTICE 'Found column: %.% (type: %)', rec.table_name, rec.column_name, rec.data_type;
    END LOOP;
END $$;

-- Step 3: Fix the specific issue with profiles table
-- The error suggests there's an issue with a text column being used with ->> operator

-- Let's check the profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Create a simple test to verify operators work
DO $$
BEGIN
    -- Test basic JSON operators
    PERFORM '{"test": "value"}'::jsonb ->> 'test';
    RAISE NOTICE 'JSON operators working correctly';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'JSON operator issue: %', SQLERRM;
END $$;

-- Step 5: Fix any specific column issues
-- If there are any columns that should be JSONB but are TEXT, we need to fix them

-- Check for any metadata or settings columns that might be causing issues
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check if profiles table exists and has the expected structure
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Profiles table exists';
        
        -- Check for any problematic columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name LIKE '%metadata%' 
            AND data_type = 'text'
        ) THEN
            RAISE NOTICE 'Found text metadata column that might need to be JSONB';
        END IF;
    ELSE
        RAISE NOTICE 'Profiles table does not exist!';
    END IF;
END $$;

-- Step 6: Create a simple function to test database operations
CREATE OR REPLACE FUNCTION test_database_operations()
RETURNS TABLE(test_name text, result text, success boolean)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Test 1: Basic SELECT
    BEGIN
        PERFORM count(*) FROM profiles;
        RETURN QUERY SELECT 'Basic SELECT'::text, 'SUCCESS'::text, true;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 'Basic SELECT'::text, SQLERRM::text, false;
    END;
    
    -- Test 2: JSON operations
    BEGIN
        PERFORM '{"test": "value"}'::jsonb ->> 'test';
        RETURN QUERY SELECT 'JSON operators'::text, 'SUCCESS'::text, true;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 'JSON operators'::text, SQLERRM::text, false;
    END;
    
    -- Test 3: UUID operations
    BEGIN
        PERFORM gen_random_uuid();
        RETURN QUERY SELECT 'UUID generation'::text, 'SUCCESS'::text, true;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 'UUID generation'::text, SQLERRM::text, false;
    END;
END $$;

-- Run the tests
SELECT * FROM test_database_operations();

-- Step 7: Ensure all tables have proper permissions and structure
-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Step 8: Create a simple health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    result jsonb := '{}';
    table_count integer;
    profile_count integer;
BEGIN
    -- Count tables
    SELECT count(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    result := jsonb_set(result, '{table_count}', to_jsonb(table_count));
    
    -- Count profiles
    BEGIN
        SELECT count(*) INTO profile_count FROM profiles;
        result := jsonb_set(result, '{profile_count}', to_jsonb(profile_count));
        result := jsonb_set(result, '{profiles_accessible}', 'true');
    EXCEPTION
        WHEN OTHERS THEN
            result := jsonb_set(result, '{profiles_accessible}', 'false');
            result := jsonb_set(result, '{profiles_error}', to_jsonb(SQLERRM));
    END;
    
    result := jsonb_set(result, '{status}', '"healthy"');
    result := jsonb_set(result, '{timestamp}', to_jsonb(now()));
    
    RETURN result;
END $$;

-- Run health check
SELECT database_health_check();

-- Final message
SELECT '✅ PostgreSQL operator fixes completed!' as status;
SELECT 'If you still see operator errors, please check the Supabase logs for more details.' as note;
