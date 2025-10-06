# Quick Setup Guide - Activity Logs & Export Features

## ⚠️ IMPORTANT: Database Setup Required

Before using the new features, you **MUST** run this SQL script in your Supabase database:

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run This SQL Script

```sql
-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE activity_logs IS 'Tracks all user activities and system events';
COMMENT ON COLUMN activity_logs.activity_type IS 'Types: login, logout, user_created, user_updated, registration_approved, registration_rejected, attendance_marked, etc.';

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view activity logs
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: System can insert activity logs
CREATE POLICY "Allow system to insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);
```

### Step 3: Also Add division_id to magang_registrations

```sql
-- Add division_id column if not exists
ALTER TABLE magang_registrations 
ADD COLUMN IF NOT EXISTS division_id BIGINT REFERENCES magang_divisions(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_magang_registrations_division_id 
ON magang_registrations(division_id);
```

### Step 4: Verify Tables Were Created

Run this to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activity_logs', 'magang_registrations');
```

You should see both tables listed.

## Testing the Features

### Test Activity Logs
1. Go to Admin Panel
2. Create a new user
3. Check "Aktivitas Terbaru" section → Should show "User baru dibuat"
4. Approve or reject a registration → Should show in activity log

### Test Export Data User
1. Click "Export Data User" button in Quick Actions
2. CSV file should download automatically
3. Open in Excel → Should display all users

### Test Attendance Report
1. Click "Lihat Laporan Presensi" button
2. CSV file should download (last 30 days)
3. Open in Excel → Should display attendance data

### Test Backup Database
1. Click "Backup Database" button
2. Supabase dashboard should open
3. Toast notification should appear with instructions

## Troubleshooting

### Activity logs not appearing?
- Check if SQL script ran successfully
- Check browser console for errors
- Verify `activity_logs` table exists in Supabase

### CSV exports not working?
- Check if you're logged in as admin
- Check browser console for errors
- Try opening API URL directly: `/api/admin/export/users`

### "Column does not exist" error?
- Run the migration for `division_id` in `magang_registrations`
- Check if all columns match the schema

## Important Notes

✅ Activity logs refresh automatically every 10 seconds
✅ CSV exports include UTF-8 BOM for Excel compatibility
✅ All admin actions are logged automatically
✅ Backup guide available in `database/BACKUP_GUIDE.md`

## What's New

### Real-time Activity Tracking
- User creation
- Registration approval/rejection  
- Login events (to be added to login API)
- Division management
- All auto-logged with timestamps

### Export Functionality
- Export all user data to CSV
- Export attendance reports with date filtering
- One-click downloads
- Excel-compatible formatting

### Backup Guide
- Complete instructions for Supabase backups
- Multiple methods (Dashboard, CLI, pg_dump)
- Restore procedures
- Best practices

## Need Help?

See `ADMIN_FEATURES_SUMMARY.md` for complete documentation.
