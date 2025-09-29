# Quick Fix for Storage Upload Error

## The Problem
Your console shows: `StorageApiError: new row violates row-level security policy`

This means the storage bucket needs proper upload permissions.

## Solution: Run This SQL

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste** the contents of `fix_storage_policies.sql`
3. **Click "Run"**

This will:
- ✅ Create/update the `presensi-images` bucket
- ✅ Set proper public access
- ✅ Create correct RLS policies for upload/read/update/delete
- ✅ Enable Row Level Security

## Alternative: UI Method (If SQL Fails)

If the SQL approach gives permission errors:

1. **Go to Storage in Supabase Dashboard**
2. **Delete** the `presensi-images` bucket if it exists
3. **Create new bucket**:
   - Name: `presensi-images`
   - Public: ✅ **Yes** (this is crucial!)
   - File size limit: 5242880 (5MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp`
4. **Go to bucket → Policies tab → Add policy**:
   - Policy name: "Allow public uploads"
   - Policy: `SELECT`, `INSERT`, `UPDATE`, `DELETE` all checked
   - Target roles: `public`, `anon`, `authenticated`

## Test Again

After fixing storage policies:
1. Refresh your app at http://localhost:3001
2. Go to presensi page
3. Upload image and click "Simpan" 
4. Check console - should show "✅ Successfully saved to database!"

The key issue was the bucket wasn't properly configured for public uploads!