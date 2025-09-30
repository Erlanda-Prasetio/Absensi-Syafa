import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side Supabase client
export const createServerClient = () => {
  const cookieStore = cookies()
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// Get authenticated user (server-side)
export const getUser = async () => {
  const supabase = createServerClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  } catch (error) {
    return { user: null, error }
  }
}

// Get user profile with role information (server-side)
export const getUserProfile = async () => {
  const { user } = await getUser()
  if (!user) return { profile: null, error: 'Not authenticated' }

  const supabase = createServerClient()
  
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

// Check if user is admin (server-side)
export const isUserAdmin = async () => {
  const { profile } = await getUserProfile()
  return profile?.role === 'admin' && profile?.is_active === true
}