/**
 * 📝 Internal Notes API
 * Private notes about conversations and customers
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

const createNoteSchema = z.object({
  note: z.string().min(1, 'Note content is required').max(5000),
  note_type: z.enum(['general', 'warning', 'follow_up', 'reminder', 'vip']).optional(),
  conversation_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  is_pinned: z.boolean().optional(),
  is_important: z.boolean().optional(),
  mentioned_employee_ids: z.array(z.string().uuid()).optional(),
})

/**
 * GET /api/notes - List notes
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const conversationId = searchParams.get('conversation_id')
      const customerId = searchParams.get('customer_id')
      const pinnedOnly = searchParams.get('pinned') === 'true'
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      let query = supabaseAdmin
        .from('internal_notes')
        .select(`
          *,
          created_by_employee:employees!internal_notes_created_by_fkey(id, full_name, email)
        `, { count: 'exact' })
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (conversationId) {
        query = query.eq('conversation_id', conversationId)
      }

      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      if (pinnedOnly) {
        query = query.eq('is_pinned', true)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: notes, error, count } = await query

      if (error) throw error

      return NextResponse.json({
        notes: notes || [],
        total: count || 0,
        limit,
        offset,
      })
    } catch (error: any) {
      console.error('Notes list error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notes', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/notes - Create note
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = createNoteSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      const data = validation.data

      // At least one of conversation_id or customer_id must be provided
      if (!data.conversation_id && !data.customer_id) {
        return NextResponse.json(
          { error: 'Either conversation_id or customer_id must be provided' },
          { status: 400 }
        )
      }

      // If conversation_id is provided, verify it belongs to this business
      if (data.conversation_id) {
        const { data: conversation } = await supabaseAdmin
          .from('conversations')
          .select('id')
          .eq('id', data.conversation_id)
          .eq('business_id', context.business.id)
          .single()

        if (!conversation) {
          return NextResponse.json(
            { error: 'Conversation not found or unauthorized' },
            { status: 404 }
          )
        }
      }

      // If customer_id is provided, verify it belongs to this business
      if (data.customer_id) {
        const { data: customer } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('id', data.customer_id)
          .eq('business_id', context.business.id)
          .single()

        if (!customer) {
          return NextResponse.json(
            { error: 'Customer not found or unauthorized' },
            { status: 404 }
          )
        }
      }

      // Create note
      const { data: note, error } = await supabaseAdmin
        .from('internal_notes')
        .insert({
          business_id: context.business.id,
          note: data.note,
          note_type: data.note_type || 'general',
          conversation_id: data.conversation_id || null,
          customer_id: data.customer_id || null,
          is_pinned: data.is_pinned || false,
          is_important: data.is_important || false,
          mentioned_employee_ids: data.mentioned_employee_ids || [],
          created_by: context.employee.id,
        })
        .select(`
          *,
          created_by_employee:employees!internal_notes_created_by_fkey(id, full_name, email)
        `)
        .single()

      if (error) throw error

      return NextResponse.json({
        note,
        message: 'Note created successfully',
      })
    } catch (error: any) {
      console.error('Note creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create note', message: error.message },
        { status: 500 }
      )
    }
  })
}
