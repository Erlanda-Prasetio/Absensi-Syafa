# Database Backup Guide

## Supabase Automated Backups

Supabase provides automated daily backups for all paid plans. For manual backups, you have several options:

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Backups**
3. Click **Download backup** to get a SQL dump

### Option 2: Using pg_dump (Command Line)
```bash
# Connect to your Supabase database and export
pg_dump -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -F c -f backup_$(date +%Y%m%d).dump

# Export as SQL
pg_dump -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f backup_$(date +%Y%m%d).sql
```

### Option 3: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Create backup
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### Option 4: Using SQL Editor (For Smaller Databases)
1. Go to **SQL Editor** in Supabase dashboard
2. Run the following to export specific tables:
```sql
-- Export user_profiles
COPY (SELECT * FROM user_profiles) TO STDOUT WITH CSV HEADER;

-- Export attendance
COPY (SELECT * FROM attendance) TO STDOUT WITH CSV HEADER;

-- Export magang_registrations
COPY (SELECT * FROM magang_registrations) TO STDOUT WITH CSV HEADER;
```

## Restore from Backup

### Using psql:
```bash
# Restore from SQL file
psql -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f backup.sql

# Restore from dump file
pg_restore -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres backup.dump
```

### Using Supabase CLI:
```bash
supabase db push --db-url postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

## Best Practices

1. **Automated Backups**: Ensure your Supabase plan includes automated daily backups
2. **Point-in-Time Recovery**: Available on Pro plan and above
3. **Manual Backups**: Schedule weekly manual backups for critical periods
4. **Test Restores**: Periodically test your backup restoration process
5. **Off-site Storage**: Download and store backups in multiple locations (cloud storage, local drives)

## Important Tables to Back Up

- `user_profiles` - User account data
- `attendance` - Daily attendance records
- `magang_registrations` - Internship applications
- `magang_divisions` - Division and slot information
- `magang_documents` - Document references
- `magang_status_history` - Application history
- `activity_logs` - System activity logs

## Emergency Contact

For backup issues or data recovery, contact Supabase support:
- Email: support@supabase.io
- Dashboard: https://supabase.com/dashboard/support
