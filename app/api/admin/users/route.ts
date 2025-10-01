import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

interface CreateUserRequest {
  email?: string
  password?: string
  name?: string
  university?: string
  division?: string
  role?: 'user' | 'admin'
  start_date?: string
  end_date?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase()

    if (!supabase) {
      console.error('[API] Supabase server client not configured - check SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Supabase server client is not configured' }, { status: 500 })
    }

    let body: CreateUserRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error('[API] Invalid JSON body:', error)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

  const { email, password, name, university, division, role, start_date, end_date } = body

  if (!email || !password || !name || !university || !division) {
    console.error('[API] Missing required fields:', { email: !!email, password: !!password, name: !!name, university: !!university, division: !!division })
    return NextResponse.json({
      error: 'Missing required fields'
    }, { status: 400 })
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    console.error('[API] Missing bearer token')
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
  }

  const { data: requester, error: requesterError } = await supabase.auth.getUser(token)

  if (requesterError || !requester?.user) {
    console.error('[API] Invalid session:', requesterError)
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { data: adminProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', requester.user.id)
    .single()

  if (profileError || !adminProfile || adminProfile.role !== 'admin' || adminProfile.is_active === false) {
    console.error('[API] Forbidden - not admin or inactive:', { profileError, adminProfile })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userRole: 'user' | 'admin' = role === 'admin' ? 'admin' : 'user'

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      university,
      division,
      role: userRole,
    },
  })

  if (authError) {
    console.error('[API] Auth user creation error:', authError)
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const newUser = authData.user

  if (!newUser) {
    console.error('[API] User creation returned no user')
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
  }

  // Trigger should insert into user_profiles automatically, but ensure it exists
  const profileData: any = {
    id: newUser.id,
    name,
    university,
    division,
    role: userRole,
    is_active: true,
  }

  if (start_date) profileData.start_date = start_date
  if (end_date) profileData.end_date = end_date

  const { error: profileInsertError } = await supabase
    .from('user_profiles')
    .upsert(profileData, { onConflict: 'id' })

  if (profileInsertError) {
    console.error('[API] Profile insert error:', profileInsertError)
    // Attempt to rollback auth user to avoid orphaned account
    await supabase.auth.admin.deleteUser(newUser.id)
    return NextResponse.json({ error: profileInsertError.message }, { status: 500 })
  }

  return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Unexpected error in POST /api/admin/users:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || String(error) 
    }, { status: 500 })
  }
}
