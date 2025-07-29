-- Fix the missing unique constraint on storage.objects that's causing upload failures
-- This constraint is required by Supabase storage system for proper ON CONFLICT handling

-- Check if the constraint exists and add it if missing
DO $$ 
BEGIN
    -- Try to add the unique constraint that Supabase storage expects
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'objects_bucketid_objname_version_key' 
        AND table_name = 'objects' 
        AND table_schema = 'storage'
    ) THEN
        -- Add the exact unique constraint that Supabase storage needs
        ALTER TABLE storage.objects 
        ADD CONSTRAINT objects_bucketid_objname_version_key 
        UNIQUE (bucket_id, name, version);
        
        RAISE NOTICE 'Added unique constraint to storage.objects table';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on storage.objects table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add constraint: %', SQLERRM;
END $$;