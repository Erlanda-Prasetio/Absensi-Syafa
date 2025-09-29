# Fixed Storage Setup Guide

The SQL approach for storage policies requires service role privileges. Here's the easier UI approach:

## Method 1: Using Supabase Dashboard (Recommended)

### Step 1: Create Storage Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **Create bucket**
4. Fill in:
   - **Name**: `presensi-images`
   - **Public bucket**: ✅ Yes (check this box)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
5. Click **Create bucket**

### Step 2: Configure Bucket Policies
1. After creating the bucket, click on it
2. Go to **Policies** tab
3. Click **New policy**
4. Use these policy templates:

**For Upload (INSERT):**
```sql
CREATE POLICY "Allow public upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'presensi-images'
);
```

**For View (SELECT):**
```sql
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'presensi-images'
);
```

### Step 3: Verify Setup
1. Go back to **Storage** 
2. You should see `presensi-images` bucket
3. Try uploading a test image to verify it works

## Method 2: If You Need SQL (Advanced)

If you must use SQL, you need to:
1. Use the service role key (not anon key)
2. Run this in a server environment, not browser
3. Or ask your Supabase project admin to run it

## Troubleshooting

- **Error 42501**: Use Dashboard UI instead of SQL
- **Bucket not appearing**: Check if it was created successfully
- **Upload failures**: Verify policies are applied correctly

After setting up storage this way, your Next.js app should work perfectly!