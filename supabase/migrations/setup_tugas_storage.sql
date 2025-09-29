-- Setup tugas-files bucket and policies
-- Run this in Supabase SQL Editor

-- 1. Create the tugas-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tugas-files',
    'tugas-files',
    true,
    10485760, -- 10MB limit for documents
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Create storage policies for tugas-files bucket
CREATE POLICY "Enable upload for tugas bucket" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'tugas-files'
    );

CREATE POLICY "Enable read for tugas bucket" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'tugas-files'
    );

CREATE POLICY "Enable update for tugas bucket" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'tugas-files'
    );

CREATE POLICY "Enable delete for tugas bucket" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'tugas-files'
    );

-- 3. Create tugas_submissions table
CREATE TABLE IF NOT EXISTS tugas_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
    submission_time TIME NOT NULL,
    submission_date DATE NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on tugas_submissions table
ALTER TABLE tugas_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for tugas_submissions table
CREATE POLICY "Enable read access for all users" ON tugas_submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON tugas_submissions
    FOR INSERT WITH CHECK (true);

-- 6. Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;