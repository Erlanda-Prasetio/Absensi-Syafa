-- Create user_profiles table with admin system support
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    university TEXT NOT NULL,
    division TEXT NOT NULL, -- Changed from DOB to division
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.user_profiles;

-- RLS Policies for user_profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.user_profiles WHERE id = auth.uid())
    );

-- Admins can view all profiles
CREATE POLICY "Admin can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Admins can insert, update, delete all profiles
CREATE POLICY "Admin can manage all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, university, division, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'university', 'Unknown'),
        COALESCE(NEW.raw_user_meta_data->>'division', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing tables to link with user profiles
ALTER TABLE public.presensi_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id);
ALTER TABLE public.tugas_submissions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id);

-- Update RLS policies for presensi_records
ALTER TABLE public.presensi_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own presensi" ON public.presensi_records;
DROP POLICY IF EXISTS "Admin can view all presensi" ON public.presensi_records;

CREATE POLICY "Users can manage own presensi" ON public.presensi_records
    FOR ALL USING (
        auth.uid() = user_id OR 
        user_id IS NULL -- For backward compatibility
    );

CREATE POLICY "Admin can view all presensi" ON public.presensi_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Update RLS policies for tugas_submissions
ALTER TABLE public.tugas_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tugas" ON public.tugas_submissions;
DROP POLICY IF EXISTS "Admin can view all tugas" ON public.tugas_submissions;

CREATE POLICY "Users can manage own tugas" ON public.tugas_submissions
    FOR ALL USING (
        auth.uid() = user_id OR 
        user_id IS NULL -- For backward compatibility
    );

CREATE POLICY "Admin can view all tugas" ON public.tugas_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_presensi_user_id ON public.presensi_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tugas_user_id ON public.tugas_submissions(user_id);

-- Note: Admin user will be created via Supabase Dashboard or auth.admin.createUser()
-- The trigger function above will automatically create the profile when a user is created

-- Optional: If you need to manually create an admin profile for an existing user
-- Replace 'your-admin-user-id' with the actual UUID from auth.users
-- 
-- INSERT INTO public.user_profiles (id, name, university, division, role)
-- VALUES (
--     'your-admin-user-id'::uuid,
--     'Administrator',
--     'DPMPTSP Jateng',
--     'IT',
--     'admin'
-- ) ON CONFLICT (id) DO UPDATE SET
--     name = EXCLUDED.name,
--     university = EXCLUDED.university,
--     division = EXCLUDED.division,
--     role = EXCLUDED.role;