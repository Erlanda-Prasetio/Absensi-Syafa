# Fix Storage Upload Error - UI Method

## The Problem
SQL commands fail with "42501: must be owner of table objects" because storage policies require special privileges.

## Solution: Use Supabase Dashboard UI

### Step 1: Delete Current Bucket (If Exists)
1. Go to **Supabase Dashboard → Storage**
2. Find `presensi-images` bucket
3. Click **⋮** (three dots) → **Delete bucket**
4. Confirm deletion

### Step 2: Create New Bucket Properly
1. Click **"New bucket"**
2. Fill in:
   - **Name**: `presensi-images`
   - **Public bucket**: ✅ **MUST BE CHECKED** (this is the key!)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
3. Click **Create bucket**

### Step 3: Verify Bucket Settings
1. Click on the `presensi-images` bucket
2. Check that it shows **"Public"** badge
3. Go to **Configuration** tab
4. Ensure **Public** is set to `true`

### Step 4: Test Upload
1. Go back to your app at http://localhost:3001/presensi
2. Upload an image and click "Simpan"
3. Check browser console for success message
4. Check Supabase **Table Editor → presensi_records** for new row

## Why This Works
- Creating bucket through UI automatically sets correct permissions
- Public buckets don't need complex RLS policies for basic upload/read
- UI method bypasses the SQL permission issues

## Alternative: Manual Policy Creation (Advanced)
If you need custom policies after creating the bucket:
1. Go to **Storage → presensi-images → Policies**
2. Click **New policy**
3. Choose **"For full customization"**
4. Policy definition:
```sql
((bucket_id = 'presensi-images'::text))
```
5. Check all operations: SELECT, INSERT, UPDATE, DELETE
6. Target roles: `public`, `anon`, `authenticated`

The key is making sure the bucket is **PUBLIC** from the start!