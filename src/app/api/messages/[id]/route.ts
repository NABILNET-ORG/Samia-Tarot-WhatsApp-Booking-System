/**
 * 💬 Message Management API
 * Individual message operations (GET, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { UpdateMessageSchema } from '@/lib/validation/schemas'

/**
 * GET /api/messages/[id] - Get message details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .select('*, conversations(business_id)')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if message belongs to current business
      if (message.conversations.business_id !== context.business.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Message not found' },
          { status: 403 }
        )
      }

      return NextResponse.json({ message })
    } catch (error: any) {
      console.error('Failed to fetch message:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * PATCH /api/messages/[id] - Update message
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input with Zod
      const validation = UpdateMessageSchema.safeParse(body)
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

      // Verify message belongs to this business
      const { data: message, error: fetchError } = await supabaseAdmin
        .from('messages')
        .select('*, conversations(business_id)')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError

      if (!message || message.conversations.business_id !== context.business.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Message not found' },
          { status: 403 }
        )
      }

      // Update message
      const { data: updatedMessage, error: updateError } = await supabaseAdmin
        .from('messages')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Log activity
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'message.update',
        action_type: 'update',
        resource_type: 'message',
        resource_id: params.id,
      })

      return NextResponse.json({
        message: updatedMessage,
        success: true
      })
    } catch (error: any) {
      console.error('Failed to update message:', error)
      return NextResponse.json(
        { error: 'Failed to update message', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/messages/[id] - Delete message (soft delete for GDPR compliance)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      // First verify the message belongs to this business
      const { data: message, error: fetchError } = await supabaseAdmin
        .from('messages')
        .select('*, conversations(business_id)')
        .eq('id', params.id)
        .single()

      if (fetchError) throw fetchError

      if (!message || message.conversations.business_id !== context.business.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Message not found' },
          { status: 403 }
        )
      }

      // Soft delete - mark as deleted instead of removing
      const { error: deleteError } = await supabaseAdmin
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: context.employee.id,
        })
        .eq('id', params.id)

      if (deleteError) throw deleteError

      // Log the deletion in activity logs
      await supabaseAdmin.from('activity_logs').insert({
        business_id: context.business.id,
        employee_id: context.employee.id,
        action: 'message.delete',
        resource_type: 'message',
        resource_id: params.id,
        details: {
          conversation_id: message.conversation_id,
          sender_type: message.sender_type,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Message deleted successfully',
      })
    } catch (error: any) {
      console.error('Failed to delete message:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  })
}
