-- Fix RLS Policy for user_profiles table
-- This fixes the infinite recursion error

-- First, disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON user_profiles;

-- Create simple, non-recursive policies
-- Policy 1: Users can always insert their own profile (using auth.uid())
CREATE POLICY "allow_insert_own_profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Policy 2: Users can always read their own profile (using auth.uid())
CREATE POLICY "allow_read_own_profile" ON user_profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Policy 3: Users can always update their own profile (using auth.uid())
CREATE POLICY "allow_update_own_profile" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Insert admin profile if it doesn't exist
INSERT INTO user_profiles (id, name, university, division, role, is_active)
VALUES (
    'b818f71d-ef43-4ab4-b36a-09cfdf903415',
    'Administrator',
    'DPMPTSP Jateng', 
    'IT',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;