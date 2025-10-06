import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract form fields
    const nama_lengkap = formData.get('nama_lengkap') as string
    const email = formData.get('email') as string
    const telepon = formData.get('telepon') as string
    const institusi = formData.get('institusi') as string
    const jurusan = formData.get('jurusan') as string
    const semester = formData.get('semester') as string
    const durasi_magang = formData.get('durasi_magang') as string
    const division_id = formData.get('division_id') as string
    const tanggal_mulai = formData.get('tanggal_mulai') as string
    const tanggal_selesai = formData.get('tanggal_selesai') as string
    const deskripsi = formData.get('deskripsi') as string

    // Validate required fields
    if (!nama_lengkap || !email || !telepon || !institusi || !division_id) {
      return NextResponse.json(
        { error: 'Field wajib harus diisi: nama_lengkap, email, telepon, institusi, division_id' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Check division availability and reduce slot
    const { data: division, error: divisionError } = await supabase
      .from('magang_divisions')
      .select('*')
      .eq('id', division_id)
      .single()

    if (divisionError || !division) {
      return NextResponse.json(
        { error: 'Divisi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if slots are available
    const availableSlots = division.available_slots ?? division.total_slots
    if (availableSlots <= 0) {
      return NextResponse.json(
        { error: 'Maaf, slot untuk divisi ini sudah penuh. Silakan pilih divisi lain.' },
        { status: 400 }
      )
    }

    // Reduce available slots by 1
    const { error: updateSlotError } = await supabase
      .from('magang_divisions')
      .update({ 
        available_slots: availableSlots - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', division_id)

    if (updateSlotError) {
      console.error('Error updating division slots:', updateSlotError)
      // Continue anyway, don't fail the registration
    }

    // Generate registration code
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const kode_pendaftaran = `MGG${timestamp}${randomNum}`

    // Insert registration data
    const { data: registration, error: insertError } = await supabase
      .from('magang_registrations')
      .insert({
        nama_lengkap,
        email,
        telepon,
        institusi,
        jurusan,
        semester,
        durasi_magang,
        tanggal_mulai,
        tanggal_selesai,
        deskripsi,
        kode_pendaftaran,
        division_id: parseInt(division_id),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal menyimpan data pendaftaran', details: insertError.message },
        { status: 500 }
      )
    }

    // Handle file uploads
    const files = formData.getAll('bukti[]') as File[]
    const uploadedFiles = []

    for (const file of files) {
      if (file && file.size > 0) {
        try {
          // Generate unique filename
          const fileExt = file.name.split('.').pop()
          const fileName = `${kode_pendaftaran}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `magang-documents/${fileName}`

          // Convert file to buffer
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: false,
            })

          if (uploadError) {
            console.error('File upload error:', uploadError)
            continue // Skip this file but continue with others
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath)

          // Determine document type based on filename or order
          let document_type = 'other'
          if (file.name.toLowerCase().includes('rekomendasi') || file.name.toLowerCase().includes('pengantar')) {
            document_type = 'surat_rekomendasi'
          } else if (file.name.toLowerCase().includes('proposal')) {
            document_type = 'proposal'
          } else if (file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('portfolio')) {
            document_type = 'cv_portfolio'
          }

          // Save document metadata to database
          const { error: docError } = await supabase
            .from('magang_documents')
            .insert({
              registration_id: registration.id,
              document_type,
              file_name: file.name,
              file_path: publicUrlData.publicUrl,
              file_size: file.size,
              file_type: file.type,
            })

          if (docError) {
            console.error('Document metadata error:', docError)
          } else {
            uploadedFiles.push({
              name: file.name,
              url: publicUrlData.publicUrl,
            })
          }
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError)
        }
      }
    }

    // Log notification (for sending email confirmation)
    await supabase.from('magang_notifications').insert({
      registration_id: registration.id,
      notification_type: 'confirmation',
      email_to: email,
      subject: 'Konfirmasi Pendaftaran Magang - DPMPTSP Jawa Tengah',
      status: 'pending',
    })

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil disimpan',
      data: {
        id: registration.id,
        kode_pendaftaran,
        nama_lengkap,
        email,
        uploaded_files: uploadedFiles.length,
      },
    })
  } catch (error) {
    console.error('Error processing registration:', error)
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat memproses pendaftaran',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET method to retrieve registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kode_pendaftaran = searchParams.get('kode_pendaftaran')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('magang_registrations')
      .select('*, magang_documents(count)')
      .order('created_at', { ascending: false })

    // Filter by registration code
    if (kode_pendaftaran) {
      query = query.eq('kode_pendaftaran', kode_pendaftaran)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil data pendaftaran', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan saat mengambil data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
