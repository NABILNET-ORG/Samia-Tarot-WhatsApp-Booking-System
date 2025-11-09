/**
 * 🔄 Give Back to AI API
 * Switch conversation from Human → AI mode
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { TakeoverConversationSchema } from '@/lib/validation/schemas'

/**
 * POST /api/conversations/givebacktoai - Give conversation back to AI
 */
export async function POST(request: NextRequest) {
  return requirePermission(request, 'conversations', 'takeover', async (context) => {
    try {
      const body = await request.json()

      const validation = TakeoverConversationSchema.safeParse(body)
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

      // Update conversation mode back to AI
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .update({
          mode: 'ai',
          assigned_employee_id: null,
          assigned_employee_name: null,
          assigned_at: null,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', validatedData.conversation_id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Create system message
      await supabaseAdmin.from('messages').insert({
        conversation_id: validatedData.conversation_id,
        business_id: context.business.id,
        sender_type: 'system',
        content: `${context.employee.full_name} handed conversation back to AI`,
        message_type: 'text',
      })

      return NextResponse.json({
        conversation,
        message: 'Conversation handed back to AI successfully',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to give back conversation to AI', message: error.message },
        { status: 500 }
      )
    }
  })
}
