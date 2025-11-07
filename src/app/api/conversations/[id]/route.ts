/**
 * 💬 Single Conversation API
 * Get conversation details
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

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
        if (body[field] !== undefined) {
          updates[field] = body[field]
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
