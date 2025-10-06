import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Fetch pending registrations with all details
    const { data: registrations, error: regError } = await supabase
      .from('magang_registrations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (regError) {
      console.error('Error fetching registrations:', regError)
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data pendaftaran' },
        { status: 500 }
      )
    }

    console.log(`Found ${registrations?.length || 0} pending registrations`)
    console.log('Registration IDs:', registrations?.map(r => ({ id: r.id, status: r.status, nama: r.nama_lengkap })))

    // Fetch documents for each registration
    const registrationsWithDocs = await Promise.all(
      registrations.map(async (reg) => {
        const { data: documents, error: docError } = await supabase
          .from('magang_documents')
          .select('*')
          .eq('registration_id', reg.id)

        return {
          ...reg,
          documents: docError ? [] : documents,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: registrationsWithDocs,
      count: registrationsWithDocs.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/registrations:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
