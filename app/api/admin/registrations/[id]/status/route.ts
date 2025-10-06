import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity, ActivityType } from '@/lib/activity-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    const body = await request.json()
    const { status, rejection_reason, changed_by, password } = body
    
    console.log('Updating registration status:', { id, status, rejection_reason, hasPassword: !!password })

    // Validate required fields
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status tidak valid' },
        { status: 400 }
      )
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { success: false, error: 'Alasan penolakan harus diisi' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Get registration details before updating
    const { data: registration, error: fetchError } = await supabase
      .from('magang_registrations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update registration status
    console.log('Updating database - ID:', id, 'Status:', status)
    const { data: updateData, error: updateError } = await supabase
      .from('magang_registrations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    console.log('Update result:', updateData)
    console.log('Update error:', updateError)

    if (updateError) {
      console.error('Error updating status:', updateError)
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate status' },
        { status: 500 }
      )
    }

    // Verify the update by reading back
    const { data: verifyData } = await supabase
      .from('magang_registrations')
      .select('id, status')
      .eq('id', id)
      .single()
    
    console.log('Verification read:', verifyData)

    // Insert status history
    const { error: historyError } = await supabase
      .from('magang_status_history')
      .insert({
        registration_id: id,
        old_status: registration.status,
        new_status: status,
        notes: status === 'rejected' ? rejection_reason : 'Pendaftaran disetujui',
        changed_by: changed_by || 'Admin',
      })

    if (historyError) {
      console.error('Error inserting history:', historyError)
    }

    // Send email notification
    try {
      const emailEndpoint = status === 'approved' 
        ? '/api/send-approval' 
        : '/api/send-rejection'
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const fullUrl = `${baseUrl}${emailEndpoint}`
      
      console.log('Sending email to:', fullUrl)
      console.log('Email data:', {
        email: registration.email,
        nama: registration.nama_lengkap,
        kode_pendaftaran: registration.kode_pendaftaran,
        password: status === 'approved' ? '***' : undefined,
        rejection_reason: status === 'rejected' ? rejection_reason : undefined,
      })
      
      const emailResponse = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registration.email,
          nama: registration.nama_lengkap,
          kode_pendaftaran: registration.kode_pendaftaran,
          password: status === 'approved' ? password : undefined,
          rejection_reason: status === 'rejected' ? rejection_reason : undefined,
        }),
      })

      const emailResult = await emailResponse.json()
      console.log('Email response:', emailResult)

      if (!emailResponse.ok) {
        console.error('Failed to send email notification:', emailResult)
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails
    }

    // Log activity
    await logActivity({
      user_email: registration.email,
      user_name: registration.nama_lengkap,
      activity_type: status === 'approved' ? ActivityType.REGISTRATION_APPROVED : ActivityType.REGISTRATION_REJECTED,
      description: status === 'approved'
        ? `Pendaftaran disetujui: ${registration.nama_lengkap} (${registration.kode_pendaftaran})`
        : `Pendaftaran ditolak: ${registration.nama_lengkap} (${registration.kode_pendaftaran})`,
      metadata: {
        registration_id: id,
        kode_pendaftaran: registration.kode_pendaftaran,
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : undefined,
        changed_by: changed_by || 'Admin',
      },
    })

    return NextResponse.json({
      success: true,
      message: status === 'approved' 
        ? 'Pendaftaran berhasil disetujui' 
        : 'Pendaftaran berhasil ditolak',
      data: { id, status, rejection_reason },
    })
  } catch (error) {
    console.error('Error in POST /api/admin/registrations/[id]/status:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
