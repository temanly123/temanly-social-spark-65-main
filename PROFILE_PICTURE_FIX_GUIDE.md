# Profile Picture Upload Fix Guide

## Problem
Users cannot upload or update profile pictures in the talent dashboard settings. The upload shows endless loading and fails to complete.

## Root Cause
The `profile-images` storage bucket does not exist in Supabase, causing all upload attempts to fail.

## Solution

### Option 1: Quick Fix via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/enyrffgedfvgunokpmqk
   - Navigate to **SQL Editor**

2. **Run the Bucket Creation SQL**
   ```sql
   -- Create profile-images bucket
   INSERT INTO storage.buckets (
       id, 
       name, 
       public, 
       file_size_limit, 
       allowed_mime_types,
       created_at,
       updated_at
   ) VALUES (
       'profile-images',
       'profile-images', 
       true,
       5242880, -- 5MB limit
       ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
       NOW(),
       NOW()
   ) ON CONFLICT (id) DO UPDATE SET
       public = true,
       file_size_limit = 5242880,
       allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
       updated_at = NOW();
   ```

3. **Create Storage Policies**
   ```sql
   -- Drop existing policies (if any)
   DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
   DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
   DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;

   -- Create upload policy
   CREATE POLICY "Users can upload profile images" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'profile-images');

   -- Create view policy
   CREATE POLICY "Public can view profile images" ON storage.objects
   FOR SELECT TO public
   USING (bucket_id = 'profile-images');

   -- Create update policy
   CREATE POLICY "Users can update their own profile images" ON storage.objects
   FOR UPDATE TO authenticated
   USING (bucket_id = 'profile-images')
   WITH CHECK (bucket_id = 'profile-images');
   ```

### Option 2: Run Complete Migration

1. **Use the provided SQL file**
   - Copy the contents of `fix-profile-images-bucket.sql`
   - Run it in the Supabase SQL Editor

### Option 3: Browser Console Diagnosis

1. **Open the Temanly website**
2. **Open browser console** (F12 → Console)
3. **Copy and paste** the contents of `browser-fix-profile-bucket.js`
4. **Follow the instructions** provided by the script

## Verification

After applying the fix:

1. **Check bucket exists**
   - Go to Supabase Dashboard → Storage
   - Verify `profile-images` bucket is listed

2. **Test upload**
   - Go to talent dashboard settings
   - Try uploading a profile picture
   - Should work without endless loading

## Code Improvements Made

### Enhanced Error Handling
- Added detailed console logging for debugging
- Better error messages for users
- File type validation
- Proper error recovery

### Key Changes in `TalentDashboard.tsx`
- Added comprehensive logging for upload process
- Improved error messages based on error type
- Added file type validation
- Better handling of bucket-not-found errors

## Troubleshooting

### If upload still fails after bucket creation:

1. **Check browser console** for detailed error messages
2. **Verify user authentication** - user must be logged in
3. **Check file requirements**:
   - Max size: 5MB
   - Allowed types: JPG, PNG, WebP
4. **Check RLS policies** in Supabase dashboard

### Common Error Messages:

- **"Bucket penyimpanan belum dikonfigurasi"** → Run the bucket creation SQL
- **"Tidak memiliki izin untuk mengunggah file"** → Check RLS policies
- **"Format file tidak didukung"** → Use JPG, PNG, or WebP files
- **"File terlalu besar"** → Reduce file size to under 5MB

## Files Modified

1. `src/pages/TalentDashboard.tsx` - Enhanced error handling and logging
2. `fix-profile-images-bucket.sql` - Complete SQL migration
3. `browser-fix-profile-bucket.js` - Browser-based diagnostic tool

## Next Steps

1. Apply the SQL migration
2. Test profile picture upload
3. Monitor for any remaining issues
4. Consider adding upload progress indicators for better UX
