import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Fetch all users
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Convert to CSV
    const csvHeaders = [
      'ID',
      'Name',
      'Email',
      'University',
      'Division',
      'Role',
      'Status',
      'Start Date',
      'End Date',
      'Created At',
    ]

    const csvRows = (users || []).map((user) => [
      user.id || '',
      user.name || '',
      user.email || '',
      user.university || '',
      user.division || '',
      user.role || '',
      user.is_active ? 'Active' : 'Inactive',
      user.start_date || '',
      user.end_date || '',
      user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '',
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

    // Return as downloadable file
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export users' },
      { status: 500 }
    )
  }
}
