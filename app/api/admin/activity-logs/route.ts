import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch recent activity logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error, count } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

// POST - Create new activity log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      user_email,
      user_name,
      activity_type,
      description,
      metadata = {},
    } = body

    // Validation
    if (!activity_type || !description) {
      return NextResponse.json(
        { success: false, error: 'activity_type and description are required' },
        { status: 400 }
      )
    }

    // Get IP and User Agent from headers
    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Insert activity log
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user_id || null,
          user_email: user_email || null,
          user_name: user_name || null,
          activity_type,
          description,
          metadata,
          ip_address,
          user_agent,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Activity log created successfully',
    })
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create activity log' },
      { status: 500 }
    )
  }
}
