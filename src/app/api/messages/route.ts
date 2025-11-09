/**
 * 💬 Messages API
 * Send messages and get conversation history
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { MessageSchema } from '@/lib/validation/schemas'

/**
 * GET /api/messages?conversation_id=xxx - Get conversation history
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const conversationId = searchParams.get('conversation_id')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      if (!conversationId) {
        return NextResponse.json(
          { error: 'conversation_id is required' },
          { status: 400 }
        )
      }

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

      // Get messages
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return NextResponse.json({ messages: messages.reverse() })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch messages', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/messages - Send a new message
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input with Zod
      const validationResult = MessageSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.issues.map(issue => ({
              path: issue.path.join('.'),
              message: issue.message
            }))
          },
          { status: 400 }
        )
      }

      const validatedData = validationResult.data
      const {
        conversation_id,
        content,
        message_type,
        media_url,
      } = validatedData

      // Verify conversation belongs to this business
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('id, phone, mode')
        .eq('id', conversation_id)
        .eq('business_id', context.business.id)
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Create message
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: validatedData.conversation_id,
          business_id: context.business.id,
          sender_type: 'agent',
          sender_id: context.employee.id,
          sender_name: context.employee.full_name,
          content: validatedData.content,
          message_type: validatedData.message_type,
          media_url: validatedData.media_url,
          delivered_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Send to customer via WhatsApp
      try {
        const { sendWhatsAppMessage } = await import('@/lib/whatsapp/multi-tenant-provider')

        await sendWhatsAppMessage(
          context.business.id,
          conversation.phone,
          validatedData.content,
          {
            mediaUrl: validatedData.media_url,
            mediaType: validatedData.message_type === 'image' ? 'image' : validatedData.message_type === 'voice' ? 'audio' : undefined,
          }
        )

        // Update message as delivered
        await supabaseAdmin
          .from('messages')
          .update({ delivered_at: new Date().toISOString() })
          .eq('id', message.id)
      } catch (whatsappError: any) {
        console.error('WhatsApp send error:', whatsappError)
        // Message saved in DB but not sent - agent can retry
        // Don't fail the API call, just log the error
      }

      return NextResponse.json({
        message,
        success: true,
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to send message', message: error.message },
        { status: 500 }
      )
    }
  })
}
