/**
 * 🤖 Process Incoming WhatsApp Message with AI
 * Central webhook processor for automated AI responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { processMessageWithAI } from '@/lib/ai/conversation-engine'
import { sendWhatsAppMessage } from '@/lib/whatsapp/multi-tenant-provider'

/**
 * POST /api/webhook/process-message
 * Called by WhatsApp webhook to process incoming messages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_id, phone, message, media_url, media_type } = body

    if (!business_id || !phone || !message) {
      return NextResponse.json(
        { error: 'business_id, phone, and message are required' },
        { status: 400 }
      )
    }

    // Get or create conversation
    let { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', business_id)
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    // Create new conversation if doesn't exist
    if (!conversation) {
      const { data: newConv } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id,
          phone,
          current_state: 'GREETING',
          mode: 'ai',
          language: 'en', // Auto-detect later
          message_history: [],
          context_data: {},
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      conversation = newConv
    }

    // Check if conversation is in human mode
    if (conversation.mode === 'human') {
      // Just save message, don't auto-respond
      await supabaseAdmin.from('messages').insert({
        conversation_id: conversation.id,
        business_id,
        sender_type: 'customer',
        content: message,
        message_type: media_type || 'text',
        media_url,
      })

      // Notify assigned employee
      if (conversation.assigned_employee_id) {
        await supabaseAdmin.from('notifications').insert({
          business_id,
          employee_id: conversation.assigned_employee_id,
          type: 'new_message',
          title: 'New customer message',
          body: `${conversation.phone}: ${message.substring(0, 100)}`,
          related_conversation_id: conversation.id,
        })
      }

      return NextResponse.json({ success: true, mode: 'human', auto_responded: false })
    }

    // AI mode - process with AI
    const aiResponse = await processMessageWithAI(
      business_id,
      conversation.id,
      message,
      conversation.current_state as any
    )

    // Update conversation
    const updatedHistory = [
      ...(conversation.message_history || []).slice(-20),
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse.message, timestamp: new Date().toISOString() },
    ]

    await supabaseAdmin
      .from('conversations')
      .update({
        current_state: aiResponse.newState,
        message_history: updatedHistory,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)

    // Save customer message
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversation.id,
      business_id,
      sender_type: 'customer',
      content: message,
      message_type: media_type || 'text',
      media_url,
    })

    // Save AI response
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversation.id,
      business_id,
      sender_type: 'agent',
      sender_name: 'AI Assistant',
      content: aiResponse.message,
      message_type: 'text',
    })

    // Send AI response via WhatsApp
    await sendWhatsAppMessage(business_id, phone, aiResponse.message)

    // Handle actions
    if (aiResponse.actions?.createBooking && aiResponse.actions.createBooking.service_id) {
      const booking = aiResponse.actions.createBooking
      await supabaseAdmin.from('bookings').insert({
        business_id,
        customer_phone: phone,
        service_id: booking.service_id,
        scheduled_at: booking.scheduled_at || new Date().toISOString(),
        status: 'pending',
        payment_status: 'pending',
        booking_source: 'whatsapp_ai'
      })
      console.log('✅ Booking created for conversation', conversation.id)
    }

    if (aiResponse.actions?.requestPayment && aiResponse.actions.requestPayment.service_id) {
      const payment = aiResponse.actions.requestPayment
      const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL}/payment?service=${payment.service_id}&phone=${encodeURIComponent(phone)}`
      await sendWhatsAppMessage(business_id, phone, `💳 Payment link: ${paymentLink}`)
      console.log('✅ Payment link sent for conversation', conversation.id)
    }

    return NextResponse.json({
      success: true,
      mode: 'ai',
      auto_responded: true,
      new_state: aiResponse.newState,
    })
  } catch (error: any) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process message', message: error.message },
      { status: 500 }
    )
  }
}
