/**
 * 📥 Export Conversation API
 * Export conversation messages as JSON or text
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    const conversationId = params.id
    const format = request.nextUrl.searchParams.get('format') || 'json'

    // Get conversation with messages
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('business_id', context.business.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get all messages
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (format === 'text') {
      // Export as plain text
      const textContent = messages
        ?.map((msg: any) => {
          const sender = msg.sender_type === 'customer' ? 'Customer' : msg.sender_name || 'AI'
          const timestamp = new Date(msg.created_at).toLocaleString()
          return `[${timestamp}] ${sender}:\n${msg.content}\n`
        })
        .join('\n')

      return new NextResponse(textContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="conversation-${conversation.phone}-${Date.now()}.txt"`
        }
      })
    } else {
      // Export as JSON
      const exportData = {
        conversation: {
          phone: conversation.phone,
          state: conversation.current_state,
          mode: conversation.mode,
          language: conversation.language,
          created_at: conversation.created_at,
          last_message_at: conversation.last_message_at
        },
        messages: messages?.map((msg: any) => ({
          sender: msg.sender_type,
          sender_name: msg.sender_name,
          content: msg.content,
          type: msg.message_type,
          timestamp: msg.created_at
        })),
        exported_at: new Date().toISOString(),
        total_messages: messages?.length || 0
      }

      return NextResponse.json(exportData, {
        headers: {
          'Content-Disposition': `attachment; filename="conversation-${conversation.phone}-${Date.now()}.json"`
        }
      })
    }
  })
}
