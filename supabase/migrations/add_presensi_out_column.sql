-- Add presensi_out field to existing presensi_records table
-- Run this in Supabase SQL Editor

-- Add presensi_out column to store checkout time  
ALTER TABLE presensi_records 
ADD COLUMN IF NOT EXISTS presensi_out TIME;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_presensi_records_out ON presensi_records(presensi_out);

-- The existing presensi_time will be treated as "presensi_in" (check-in time)
-- The new presensi_out will store the check-out time
-- Both times will be on the same record for the same day