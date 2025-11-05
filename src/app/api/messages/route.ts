/**
 * 💬 Messages API
 * Send messages and get conversation history
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'

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
      const {
        conversation_id,
        content,
        message_type = 'text',
        media_url,
        media_thumbnail_url,
        media_duration_seconds,
      } = body

      if (!conversation_id || !content) {
        return NextResponse.json(
          { error: 'conversation_id and content are required' },
          { status: 400 }
        )
      }

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
          conversation_id,
          business_id: context.business.id,
          sender_type: 'agent',
          sender_id: context.employee.id,
          sender_name: context.employee.full_name,
          content,
          message_type,
          media_url,
          media_thumbnail_url,
          media_duration_seconds,
          delivered_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // TODO: Send to customer via WhatsApp (integrate with existing WhatsApp service)
      // This will be handled by the WhatsApp provider
      // For now, just store in database and show in UI

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
