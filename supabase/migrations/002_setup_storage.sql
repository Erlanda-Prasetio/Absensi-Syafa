-- Storage setup for presensi images
-- IMPORTANT: Create the bucket first through Supabase Dashboard, then run this SQL

-- Step 1: Go to Supabase Dashboard > Storage > Create new bucket
-- Bucket name: presensi-images
-- Make it public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Step 2: After creating the bucket through UI, run this SQL for policies:

-- Check if RLS is enabled on storage.objects (usually it is by default)
-- If you get permission errors, the bucket policies will be handled by the UI

-- Alternative: Manual bucket creation (if UI method doesn't work)
-- This might require service role privileges
DO $$ 
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'presensi-images',
        'presensi-images',
        true,
        5242880, -- 5MB limit
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    ) ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privileges to create bucket. Please create through Supabase Dashboard UI.';
END $$;