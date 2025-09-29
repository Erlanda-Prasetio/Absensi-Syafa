# Supabase Database Setup for Presensi System

This guide will help you set up the database schema and storage for the presensi (attendance) system.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. Access to your Supabase dashboard

## Database Setup Steps

### Step 1: Run the Main Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_create_presensi_system.sql`
4. Click **Run** to execute the migration

This will create:
- `presensi_records` table with all required fields
- Proper indexes for performance
- Row Level Security policies
- Triggers for automatic `updated_at` timestamps

### Step 2: Setup Storage

**Important**: Due to permissions, create the storage bucket through the Supabase Dashboard UI:

1. Go to **Storage** in your Supabase dashboard
2. Click **Create bucket**
3. Set name as `presensi-images` 
4. Enable **Public bucket**
5. Set file size limit to 5MB
6. Add allowed MIME types: `image/jpeg,image/png,image/webp`

**Alternative**: See `STORAGE_SETUP.md` for detailed step-by-step UI instructions.

This will create:
- A storage bucket named `presensi-images`
- Proper storage policies for file uploads
- File size limits (5MB) and MIME type restrictions

### Step 3: Configure Environment Variables

1. In your Supabase dashboard, go to **Settings > API**
2. Copy your project URL and anon key
3. Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Verify Setup

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the `presensi_records` table
3. Go to **Storage** and verify the `presensi-images` bucket exists

## Table Schema

The `presensi_records` table contains:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | User's full name |
| `university` | VARCHAR(255) | University name |
| `presensi_time` | TIME | Time of attendance |
| `presensi_date` | DATE | Date of attendance |
| `image_url` | TEXT | URL to uploaded selfie image |
| `image_filename` | TEXT | Original filename of uploaded image |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

## Storage Configuration

- **Bucket Name**: `presensi-images`
- **File Size Limit**: 5MB
- **Allowed Types**: JPEG, JPG, PNG, WebP
- **Public Access**: Enabled for easy image serving

## Security Notes

- Row Level Security (RLS) is enabled
- Current policies allow public access (adjust as needed)
- For production, consider adding authentication and user-specific policies

## Next Steps

After running these migrations:

1. Test the connection by running your Next.js app
2. Try submitting a presensi record through the UI
3. Verify data appears in the Supabase table
4. Check that images upload to storage successfully

## Troubleshooting

- If you get permission errors, ensure RLS policies are correctly applied
- If images don't upload, check the storage bucket policies
- If the table doesn't appear, verify the migration ran without errors