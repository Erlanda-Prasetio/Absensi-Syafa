import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

interface ChangePasswordRequest {
  user_id?: string
  new_password?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerSupabase()

    if (!supabase) {
      console.error('[API] Supabase server client not configured - check SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Supabase server client is not configured' }, { status: 500 })
    }

    let body: ChangePasswordRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error('[API] Invalid JSON body:', error)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { user_id, new_password } = body

    if (!user_id || !new_password) {
      console.error('[API] Missing required fields:', { user_id: !!user_id, new_password: !!new_password })
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    if (new_password.length < 6) {
      return NextResponse.json({
        error: 'Password minimal 6 karakter'
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

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    )

    if (updateError) {
      console.error('[API] Password update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('[API] Unexpected error in POST /api/admin/change-password:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error?.message || String(error) 
    }, { status: 500 })
  }
}
