-- Update presensi_records to support check-in and check-out
-- Run this in Supabase SQL Editor

-- Add new columns to existing table
ALTER TABLE presensi_records 
ADD COLUMN IF NOT EXISTS presensi_masuk_time TIME,
ADD COLUMN IF NOT EXISTS presensi_pulang_time TIME,
ADD COLUMN IF NOT EXISTS presensi_masuk_image_url TEXT,
ADD COLUMN IF NOT EXISTS presensi_pulang_image_url TEXT,
ADD COLUMN IF NOT EXISTS presensi_masuk_filename TEXT,
ADD COLUMN IF NOT EXISTS presensi_pulang_filename TEXT;

-- Copy existing data to new masuk columns
UPDATE presensi_records 
SET 
    presensi_masuk_time = presensi_time::TIME,
    presensi_masuk_image_url = image_url,
    presensi_masuk_filename = image_filename
WHERE presensi_masuk_time IS NULL;

-- You can keep the old columns for backward compatibility or drop them later
-- DROP COLUMN presensi_time, DROP COLUMN image_url, DROP COLUMN image_filename;