/**
 * 💬 Single Conversation API
 * Get conversation details
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { UpdateConversationSchema } from '@/lib/validation/schemas'

type RouteParams = {
  params: { id: string }
}

/**
 * GET /api/conversations/[id] - Get conversation details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (error || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      return NextResponse.json({ conversation })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch conversation', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/conversations/[id] - Update conversation metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      const validation = UpdateConversationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.error.format()
          },
          { status: 400 }
        )
      }
      const validatedData = validation.data

      // Allowed fields to update
      const allowedFields = [
        'current_state',
        'language',
        'context_data',
        'notes',
        'priority',
        'tags',
        'is_active',
        'assigned_to',
      ]

      // Filter only allowed fields
      const updates: any = {}
      for (const field of allowedFields) {
        if (validatedData[field as keyof typeof validatedData] !== undefined) {
          updates[field] = validatedData[field as keyof typeof validatedData]
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        )
      }

      // Update conversation
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      // Log the update in activity logs
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'conversation.update',
        resource_type: 'conversation',
        resource_id: id,
        details: {
          updated_fields: Object.keys(updates),
          updates,
        },
      })

      return NextResponse.json({
        success: true,
        conversation,
      })
    } catch (error: any) {
      console.error('Failed to update conversation:', error)
      return NextResponse.json(
        { error: 'Failed to update conversation', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/conversations/[id] - Soft delete conversation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Verify conversation belongs to business
      const { data: conversation, error: fetchError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Soft delete conversation
      const { error: deleteError } = await supabaseAdmin
        .from('conversations')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: context.employee.id,
        })
        .eq('id', id)

      if (deleteError) throw deleteError

      // Log deletion
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'conversation.delete',
        resource_type: 'conversation',
        resource_id: id,
        details: {
          phone: conversation.phone,
          mode: conversation.mode,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Conversation deleted successfully',
      })
    } catch (error: any) {
      console.error('Failed to delete conversation:', error)
      return NextResponse.json(
        { error: 'Failed to delete conversation', message: error.message },
        { status: 500 }
      )
    }
  })
}
