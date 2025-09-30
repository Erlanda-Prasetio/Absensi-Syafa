import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Browser (client) Supabase instance using public env vars
export const getBrowserSupabase = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createSupabaseClient(url, anonKey)
}

// Server-side Supabase client using service role key (use carefully)
export const getServerSupabase = (): SupabaseClient | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createSupabaseClient(url, serviceKey)
}
