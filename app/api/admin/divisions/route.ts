import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all divisions
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('magang_divisions')
      .select('*')
      .order('nama_divisi', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch divisions' },
      { status: 500 }
    )
  }
}

// POST - Create new division
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama_divisi, total_slots, description } = body

    // Validation
    if (!nama_divisi || nama_divisi.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama divisi is required' },
        { status: 400 }
      )
    }

    if (total_slots === undefined || total_slots < 0) {
      return NextResponse.json(
        { success: false, error: 'Total slots must be >= 0' },
        { status: 400 }
      )
    }

    // Insert new division (available_slots = total_slots initially)
    const { data, error } = await supabase
      .from('magang_divisions')
      .insert([
        {
          nama_divisi: nama_divisi.trim(),
          total_slots: parseInt(total_slots),
          available_slots: parseInt(total_slots), // Initially all slots are available
          description: description?.trim() || null,
          is_active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Divisi dengan nama tersebut sudah ada' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Division created successfully',
    })
  } catch (error) {
    console.error('Error creating division:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create division' },
      { status: 500 }
    )
  }
}

// PUT - Update existing division
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    
    // Accept ID from either query params or body
    const id = searchParams.get('id') || body.id
    const { nama_divisi, total_slots, available_slots, description, is_active } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Division ID is required' },
        { status: 400 }
      )
    }

    // Validation
    if (nama_divisi && nama_divisi.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nama divisi cannot be empty' },
        { status: 400 }
      )
    }

    if (total_slots !== undefined && total_slots < 0) {
      return NextResponse.json(
        { success: false, error: 'Total slots must be >= 0' },
        { status: 400 }
      )
    }

    if (available_slots !== undefined && available_slots < 0) {
      return NextResponse.json(
        { success: false, error: 'Available slots must be >= 0' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    if (nama_divisi) updateData.nama_divisi = nama_divisi.trim()
    if (total_slots !== undefined) updateData.total_slots = parseInt(total_slots)
    if (available_slots !== undefined) updateData.available_slots = parseInt(available_slots)
    if (description !== undefined) updateData.description = description?.trim() || null
    if (is_active !== undefined) updateData.is_active = is_active

    // Update division
    const { data, error } = await supabase
      .from('magang_divisions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { success: false, error: 'Divisi dengan nama tersebut sudah ada' },
          { status: 409 }
        )
      }
      throw error
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Division not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Division updated successfully',
    })
  } catch (error) {
    console.error('Error updating division:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update division' },
      { status: 500 }
    )
  }
}

// DELETE - Delete division
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Division ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('magang_divisions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Division deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting division:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete division' },
      { status: 500 }
    )
  }
}
