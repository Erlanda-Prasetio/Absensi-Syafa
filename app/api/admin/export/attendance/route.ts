import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const userId = searchParams.get('user_id')

    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        *,
        user:user_profiles(name, email, division)
      `)
      .order('date', { ascending: false })

    // Apply filters
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: attendance, error } = await query

    if (error) throw error

    // Convert to CSV
    const csvHeaders = [
      'Date',
      'User Name',
      'Email',
      'Division',
      'Check In',
      'Check In Location',
      'Check Out',
      'Check Out Location',
      'Status',
      'Notes',
    ]

    const csvRows = (attendance || []).map((record: any) => [
      record.date || '',
      record.user?.name || '',
      record.user?.email || '',
      record.user?.division || '',
      record.check_in_time || '',
      record.check_in_location || '',
      record.check_out_time || '',
      record.check_out_location || '',
      record.status || '',
      record.notes || '',
    ])

    // Format CSV with proper escaping
    const formatCSVCell = (cell: string) => {
      const cellStr = String(cell)
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }

    const csvContent = [
      csvHeaders.map(formatCSVCell).join(','),
      ...csvRows.map(row => row.map(formatCSVCell).join(','))
    ].join('\n')

    // Add BOM for proper Excel UTF-8 support
    const bom = '\uFEFF'
    const csvWithBOM = bom + csvContent

    // Generate filename with date range
    const dateRange = startDate && endDate 
      ? `${startDate}_to_${endDate}`
      : new Date().toISOString().slice(0, 10)

    // Return as downloadable file
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_report_${dateRange}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export attendance data' },
      { status: 500 }
    )
  }
}
