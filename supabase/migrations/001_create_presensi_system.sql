-- Migration: Create presensi system tables and storage
-- Run this in your Supabase SQL Editor

-- 1. Create presensi_records table
CREATE TABLE IF NOT EXISTS public.presensi_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
    presensi_time TIME NOT NULL,
    presensi_date DATE NOT NULL,
    image_url TEXT,
    image_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create trigger for updated_at
CREATE TRIGGER update_presensi_records_updated_at 
    BEFORE UPDATE ON public.presensi_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presensi_records_date ON public.presensi_records(presensi_date);
CREATE INDEX IF NOT EXISTS idx_presensi_records_name ON public.presensi_records(name);
CREATE INDEX IF NOT EXISTS idx_presensi_records_university ON public.presensi_records(university);
CREATE INDEX IF NOT EXISTS idx_presensi_records_created_at ON public.presensi_records(created_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.presensi_records ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
-- Allow anyone to insert their own presensi record
CREATE POLICY "Allow public insert" ON public.presensi_records
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read all presensi records (adjust as needed)
CREATE POLICY "Allow public select" ON public.presensi_records
    FOR SELECT USING (true);

-- Optional: Allow users to update their own records (if you need editing functionality)
CREATE POLICY "Allow public update" ON public.presensi_records
    FOR UPDATE USING (true);

-- 7. Grant permissions
GRANT ALL ON public.presensi_records TO anon;
GRANT ALL ON public.presensi_records TO authenticated;