/**
 * 🗑️ Clear Conversation API
 * Delete all messages in a conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    const conversationId = params.id

    // Verify conversation belongs to this business
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('business_id', context.business.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Delete all messages in this conversation
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('Failed to clear conversation:', error)
      return NextResponse.json({ error: 'Failed to clear conversation' }, { status: 500 })
    }

    // Reset conversation state
    await supabaseAdmin
      .from('conversations')
      .update({
        current_state: 'GREETING',
        message_history: [],
        context_data: {},
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    return NextResponse.json({ success: true, message: 'Conversation cleared successfully' })
  })
}
