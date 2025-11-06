/**
 * 📝 Internal Notes API - Single Note Operations
 * Update and delete specific notes
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const updateNoteSchema = z.object({
  note: z.string().min(1).max(5000).optional(),
  note_type: z.enum(['general', 'warning', 'follow_up', 'reminder', 'vip']).optional(),
  is_pinned: z.boolean().optional(),
  is_important: z.boolean().optional(),
  mentioned_employee_ids: z.array(z.string().uuid()).optional(),
})

/**
 * PATCH /api/notes/[id] - Update note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      // Validate input
      const validation = updateNoteSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      // Check if note exists and belongs to this business
      const { data: existingNote, error: fetchError } = await supabaseAdmin
        .from('internal_notes')
        .select('id, business_id, created_by')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingNote) {
        return NextResponse.json(
          { error: 'Note not found or unauthorized' },
          { status: 404 }
        )
      }

      // Update note
      const { data: note, error } = await supabaseAdmin
        .from('internal_notes')
        .update({
          ...validation.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          created_by_employee:employees!internal_notes_created_by_fkey(id, full_name, email)
        `)
        .single()

      if (error) throw error

      return NextResponse.json({
        note,
        message: 'Note updated successfully',
      })
    } catch (error: any) {
      console.error('Note update error:', error)
      return NextResponse.json(
        { error: 'Failed to update note', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/notes/[id] - Delete note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Check if note exists and belongs to this business
      const { data: existingNote, error: fetchError } = await supabaseAdmin
        .from('internal_notes')
        .select('id, business_id, created_by')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingNote) {
        return NextResponse.json(
          { error: 'Note not found or unauthorized' },
          { status: 404 }
        )
      }

      // Delete note
      const { error } = await supabaseAdmin
        .from('internal_notes')
        .delete()
        .eq('id', id)

      if (error) throw error

      return NextResponse.json({
        message: 'Note deleted successfully',
      })
    } catch (error: any) {
      console.error('Note deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete note', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * GET /api/notes/[id] - Get single note
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      const { data: note, error } = await supabaseAdmin
        .from('internal_notes')
        .select(`
          *,
          created_by_employee:employees!internal_notes_created_by_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (error || !note) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ note })
    } catch (error: any) {
      console.error('Note fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch note', message: error.message },
        { status: 500 }
      )
    }
  })
}
