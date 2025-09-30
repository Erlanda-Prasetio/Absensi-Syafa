import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

interface CreateUserRequest {
  email?: string
  password?: string
  name?: string
  university?: string
  division?: string
  role?: 'user' | 'admin'
}

export async function POST(request: NextRequest) {
  const supabase = getServerSupabase()

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase server client is not configured' }, { status: 500 })
  }

  let body: CreateUserRequest
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, password, name, university, division, role } = body

  if (!email || !password || !name || !university || !division) {
    return NextResponse.json({
      error: 'Missing required fields'
    }, { status: 400 })
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
  }

  const { data: requester, error: requesterError } = await supabase.auth.getUser(token)

  if (requesterError || !requester?.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { data: adminProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', requester.user.id)
    .single()

  if (profileError || !adminProfile || adminProfile.role !== 'admin' || adminProfile.is_active === false) {
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
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  const newUser = authData.user

  if (!newUser) {
    return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
  }

  // Trigger should insert into user_profiles automatically, but ensure it exists
  const { error: profileInsertError } = await supabase
    .from('user_profiles')
    .upsert({
      id: newUser.id,
      name,
      university,
      division,
      role: userRole,
      is_active: true,
    }, { onConflict: 'id' })

  if (profileInsertError) {
    // Attempt to rollback auth user to avoid orphaned account
    await supabase.auth.admin.deleteUser(newUser.id)
    return NextResponse.json({ error: profileInsertError.message }, { status: 500 })
  }

  return NextResponse.json({ user: newUser }, { status: 201 })
}
