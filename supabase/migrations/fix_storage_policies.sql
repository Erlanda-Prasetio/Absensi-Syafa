-- Fix storage bucket policies for presensi-images
-- Run this in Supabase SQL Editor to fix the upload permission issue

-- 1. First, check if the bucket exists and create it if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'presensi-images',
    'presensi-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- 3. Create new policies that work
CREATE POLICY "Enable upload for presensi bucket" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'presensi-images'
    );

CREATE POLICY "Enable read for presensi bucket" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'presensi-images'
    );

CREATE POLICY "Enable update for presensi bucket" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'presensi-images'
    );

CREATE POLICY "Enable delete for presensi bucket" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'presensi-images'
    );

-- 4. Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;