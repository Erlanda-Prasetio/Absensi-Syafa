# Creating Admin User - Step by Step Guide

## Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard** → Your Project → Authentication → Users
2. **Click "Add User"**
3. **Fill in the details:**
   - Email: `admin@dpmptsp.jatengprov.go.id`
   - Password: `AdminPass123!` (change this immediately!)
   - Confirm Password: `AdminPass123!`
   - **User Metadata (JSON):**
   ```json
   {
     "name": "Administrator",
     "university": "DPMPTSP Jateng", 
     "division": "IT",
     "role": "admin"
   }
   ```
4. **Click "Create User"**
5. The trigger will automatically create the profile in `user_profiles` table

## Option 2: Via SQL (if Dashboard doesn't work)

1. **First, run the migration** (`safe_admin_system.sql`)
2. **Then create admin user with this SQL:**

```sql
-- Create admin user via Supabase auth
SELECT auth.create_user(
  'admin@dpmptsp.jatengprov.go.id',
  'AdminPass123!',
  '{"name": "Administrator", "university": "DPMPTSP Jateng", "division": "IT", "role": "admin"}'::jsonb
);
```

## Option 3: Via Code (Admin Panel)

1. **Run the migration first**
2. **Temporarily create a bootstrap admin:**
   - In SQL Editor, run:
   ```sql
   -- Get any existing user ID or create temporary one
   INSERT INTO public.user_profiles (id, name, university, division, role)
   VALUES (
     (SELECT id FROM auth.users LIMIT 1), -- Use first user's ID
     'Bootstrap Admin',
     'DPMPTSP Jateng',
     'IT', 
     'admin'
   ) ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
3. **Login with that user**
4. **Use admin panel to create proper admin account**
5. **Delete bootstrap admin**

## After Creating Admin:

1. **Login with admin credentials**
2. **Change the password immediately**
3. **Create other user accounts via admin panel**
4. **Test the system thoroughly**

## Security Notes:

- ⚠️ **CHANGE DEFAULT PASSWORD IMMEDIATELY**
- 🔒 **Use strong passwords for all accounts**
- 👥 **Only create accounts for authorized users**
- 🛡️ **Regular security audits recommended**