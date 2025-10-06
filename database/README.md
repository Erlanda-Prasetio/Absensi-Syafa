# Database Setup Guide - Magang Registration System

## Overview
This database schema is designed to handle internship (magang) registrations for DPMPTSP Provinsi Jawa Tengah, including document uploads, status tracking, and notifications.

## Database Tables

### 1. `magang_registrations`
Main table for storing internship applications.

**Fields:**
- `id` - Auto-increment primary key
- `nama_lengkap` - Full name (required)
- `email` - Email address (required)
- `telepon` - Phone number (required)
- `institusi` - Educational institution (required)
- `jurusan` - Major/field of study
- `semester` - Current semester
- `durasi_magang` - Internship duration (1-bulan, 2-bulan, 3-bulan, 6-bulan)
- `tanggal_mulai` - Start date
- `tanggal_selesai` - End date
- `deskripsi` - Motivation and goals
- `status` - Current status (pending, review, approved, rejected, completed)
- `kode_pendaftaran` - Unique registration code (e.g., MGG2025100300001)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### 2. `magang_documents`
Stores uploaded documents for each registration.

**Fields:**
- `id` - Auto-increment primary key
- `registration_id` - Foreign key to magang_registrations
- `document_type` - Type of document (surat_rekomendasi, proposal, cv_portfolio, other)
- `file_name` - Original filename
- `file_path` - Storage path or URL
- `file_size` - File size in bytes
- `file_type` - MIME type
- `uploaded_at` - Upload timestamp

### 3. `magang_status_history`
Tracks all status changes for audit trail.

**Fields:**
- `id` - Auto-increment primary key
- `registration_id` - Foreign key to magang_registrations
- `old_status` - Previous status
- `new_status` - New status
- `notes` - Reason or notes for status change
- `changed_by` - Admin who made the change
- `changed_at` - Change timestamp

### 4. `magang_notifications`
Logs email notifications sent to applicants.

**Fields:**
- `id` - Auto-increment primary key
- `registration_id` - Foreign key to magang_registrations
- `notification_type` - Type (confirmation, status_update, reminder, approval, rejection)
- `email_to` - Recipient email
- `subject` - Email subject
- `sent_at` - When email was sent
- `status` - Delivery status (sent, failed, pending)
- `error_message` - Error details if failed

## Setup Instructions

### Option 1: MySQL/MariaDB
```bash
# Import the schema
mysql -u your_username -p your_database < database/magang_schema.sql
```

### Option 2: Supabase

1. **Create tables in Supabase Dashboard:**
   - Go to SQL Editor in Supabase
   - Copy contents of `magang_schema.sql`
   - Execute the SQL

2. **Set up Storage Bucket:**
   ```sql
   -- Create storage bucket for documents
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('documents', 'documents', true);
   
   -- Set up storage policies
   CREATE POLICY "Allow public uploads"
   ON storage.objects FOR INSERT
   TO public
   WITH CHECK (bucket_id = 'documents');
   
   CREATE POLICY "Allow public downloads"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'documents');
   ```

3. **Configure Row Level Security (RLS):**
   ```sql
   -- Enable RLS on tables
   ALTER TABLE magang_registrations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE magang_documents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE magang_status_history ENABLE ROW LEVEL SECURITY;
   ALTER TABLE magang_notifications ENABLE ROW LEVEL SECURITY;
   
   -- Allow inserts from API
   CREATE POLICY "Enable insert for API"
   ON magang_registrations FOR INSERT
   TO authenticated, anon
   WITH CHECK (true);
   
   -- Allow reads for authenticated users (admins)
   CREATE POLICY "Enable read for authenticated users"
   ON magang_registrations FOR SELECT
   TO authenticated
   USING (true);
   ```

## Environment Variables

Add these to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration
SMTP_EMAIL=your-email@gmail.com
SMTP_APP_PASSWORD=your-16-char-app-password
```

## API Endpoints

### POST /api/magang
Submit a new internship registration.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with fields and files

**Response:**
```json
{
  "success": true,
  "message": "Pendaftaran berhasil disimpan",
  "data": {
    "id": 1,
    "kode_pendaftaran": "MGG2025100300001",
    "nama_lengkap": "John Doe",
    "email": "john@example.com",
    "uploaded_files": 3
  }
}
```

### GET /api/magang
Retrieve registrations.

**Query Parameters:**
- `kode_pendaftaran` - Filter by registration code
- `status` - Filter by status
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## Stored Procedures

### generate_kode_pendaftaran
Generates unique registration code in format: MGG + YYYYMMDD + 5-digit ID

### update_registration_status
Updates status and creates audit trail entry.

**Usage:**
```sql
CALL update_registration_status(
  1,                     -- registration_id
  'approved',            -- new_status
  'Documents verified',  -- notes
  'admin@example.com'    -- changed_by
);
```

## Useful Queries

### Get registration with documents
```sql
SELECT r.*, d.document_type, d.file_name, d.file_path
FROM magang_registrations r
LEFT JOIN magang_documents d ON r.id = d.registration_id
WHERE r.kode_pendaftaran = 'MGG2025100300001';
```

### Monthly statistics
```sql
SELECT 
  DATE_FORMAT(created_at, '%Y-%m') as month,
  COUNT(*) as total_registrations,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM magang_registrations
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;
```

## Security Considerations

1. **File Upload Validation**
   - Max file size: 10MB
   - Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG
   - Files are uploaded to secure storage

2. **Email Validation**
   - Format validation on both frontend and backend
   - Duplicate email check recommended

3. **Data Protection**
   - Use HTTPS for all API requests
   - Encrypt sensitive data in transit
   - Regular backups of database

4. **Access Control**
   - Use RLS policies in Supabase
   - Implement admin authentication for status updates
   - Audit trail for all changes

## Maintenance

### Regular Tasks
1. Clean up old pending registrations (> 30 days)
2. Archive completed registrations (> 1 year)
3. Monitor storage usage for uploaded documents
4. Review failed notification logs

### Backup
```bash
# Export database
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql

# Supabase backup via dashboard or CLI
supabase db dump -f backup.sql
```

## Support

For issues or questions:
- Email: ptsp@jatengprov.go.id
- Phone: (024) 3520369
