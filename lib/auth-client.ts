import { createBrowserClient } from '@supabase/ssr'

// Client-side Supabase client
export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Auth helper functions for client-side
export const signIn = async (email: string, password: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export const signOut = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Admin functions for creating users (client-side)
export const createUserAccount = async (userData: {
  email: string
  password: string
  name: string
  university: string
  division: string
  role?: 'user' | 'admin'
}) => {
  const supabase = createClient()

  // First, create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        name: userData.name,
        university: userData.university,
        division: userData.division,
        role: userData.role || 'user'
      }
    }
  })

  if (authError) {
    return { data: null, error: authError }
  }

  return { data: authData, error: null }
}

// Get current user (client-side)
export const getCurrentUser = async () => {
  const supabase = createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    return { user: null, error }
  }
}

// Get user profile (client-side)
export const getCurrentUserProfile = async () => {
  const { user } = await getCurrentUser()
  if (!user) return { profile: null, error: 'Not authenticated' }

  const supabase = createClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return { profile, error }
  } catch (error) {
    return { profile: null, error }
  }
}

// Update user profile (client-side)
export const updateUserProfile = async (userId: string, updates: {
  name?: string
  university?: string
  division?: string
  role?: 'user' | 'admin'
  is_active?: boolean
}) => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// Delete user (admin only, client-side)
export const deleteUser = async (userId: string) => {
  const supabase = createClient()

  // First delete from user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    return { error: profileError }
  }

  // Then delete from auth (this requires RPC call or admin privileges)
  // For now, we'll just deactivate the user
  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: false })
    .eq('id', userId)

  return { error }
}

// Get all users (admin only, client-side)
export const getAllUsers = async () => {
  const supabase = createClient()

  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return { users, error }
}

// Check if current user is admin
export const checkIsAdmin = async () => {
  const { profile } = await getCurrentUserProfile()
  return profile?.role === 'admin' && profile?.is_active === true
}