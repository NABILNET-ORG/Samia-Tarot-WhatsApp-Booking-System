/**
 * 🔄 Conversation Takeover API
 * Switch conversation from AI → Human agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'

/**
 * POST /api/conversations/takeover - Take over conversation from AI
 */
export async function POST(request: NextRequest) {
  return requirePermission(request, 'conversations', 'takeover', async (context) => {
    try {
      const body = await request.json()
      const { conversation_id } = body

      if (!conversation_id) {
        return NextResponse.json(
          { error: 'conversation_id is required' },
          { status: 400 }
        )
      }

      // Update conversation mode and assign to employee
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .update({
          mode: 'human',
          assigned_employee_id: context.employee.id,
          assigned_employee_name: context.employee.full_name,
          assigned_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversation_id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Create system message
      await supabaseAdmin.from('messages').insert({
        conversation_id,
        business_id: context.business.id,
        sender_type: 'system',
        content: `${context.employee.full_name} joined the conversation`,
        message_type: 'text',
      })

      return NextResponse.json({
        conversation,
        message: 'Conversation taken over successfully',
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to take over conversation', message: error.message },
        { status: 500 }
      )
    }
  })
}
