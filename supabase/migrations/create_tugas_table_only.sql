-- Create tugas_submissions table only
-- Run this in Supabase SQL Editor

CREATE TABLE tugas_submissions (
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

-- Enable RLS on tugas_submissions table
ALTER TABLE tugas_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for tugas_submissions table
CREATE POLICY "Enable read access for all users" ON tugas_submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON tugas_submissions
    FOR INSERT WITH CHECK (true);