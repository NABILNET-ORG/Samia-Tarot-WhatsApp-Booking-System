/**
 * 🤖 Process Incoming WhatsApp Message with AI
 * Central webhook processor for automated AI responses
 * INTERNAL ONLY - Requires internal API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { processMessageWithAI } from '@/lib/ai/conversation-engine'
import { sendWhatsAppMessage } from '@/lib/whatsapp/multi-tenant-provider'
import { requireInternalApiKey } from '@/lib/security/api-keys'
import { processWorkflowMessage, startWorkflowExecution } from '@/lib/automation/workflow-executor'
import { z } from 'zod'

// Validation schema for the request
const processMessageSchema = z.object({
  business_id: z.string().uuid('Invalid business_id'),
  phone: z.string().min(7, 'Invalid phone number'),
  message: z.string().min(1, 'Message cannot be empty'),
  media_url: z.string().url().optional(),
  media_type: z.enum(['text', 'voice', 'image', 'document', 'video', 'audio']).optional(),
})

/**
 * POST /api/webhook/process-message
 * Called by WhatsApp webhook to process incoming messages
 *
 * Security: This endpoint should only be called internally by other API routes
 * Add X-Internal-API-Key header with INTERNAL_API_KEY env var
 */
export async function POST(request: NextRequest) {
  try {
    // Verify internal API key with timing-safe comparison
    const keyValidation = requireInternalApiKey(request)
    if (!keyValidation.valid) {
      console.warn('⚠️ Unauthorized access attempt to internal webhook processor')
      return NextResponse.json(
        { error: 'Unauthorized', message: keyValidation.error },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate request body with Zod
    const validation = processMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      )
    }

    const { business_id, phone, message, media_url, media_type } = validation.data

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

      // Start workflow execution for new conversation
      await startWorkflowExecution(business_id, conversation.id)
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

    // Check if there's an active workflow for this business
    const { data: activeWorkflow } = await supabaseAdmin
      .from('automation_workflows')
      .select('id')
      .eq('business_id', business_id)
      .eq('is_active', true)
      .single()

    let responseMessage = ''
    let useWorkflow = false

    if (activeWorkflow) {
      // Use workflow execution
      useWorkflow = true
      console.log('🤖 Using workflow execution for conversation:', conversation.id)

      const workflowResult = await processWorkflowMessage(conversation.id, message)

      if (workflowResult.responseMessage) {
        responseMessage = workflowResult.responseMessage
      } else if (workflowResult.shouldUseAI) {
        // Workflow says to use AI for this step
        const aiResponse = await processMessageWithAI(
          business_id,
          conversation.id,
          message,
          conversation.current_state as any
        )
        responseMessage = aiResponse.message
      } else {
        // Workflow handled everything, no response needed
        return NextResponse.json({
          success: true,
          mode: 'workflow',
          auto_responded: true,
        })
      }
    } else {
      // No active workflow - use traditional AI mode
      const aiResponse = await processMessageWithAI(
        business_id,
        conversation.id,
        message,
        conversation.current_state as any
      )
      responseMessage = aiResponse.message
    }

    // Update conversation
    const updatedHistory = [
      ...(conversation.message_history || []).slice(-20),
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: responseMessage, timestamp: new Date().toISOString() },
    ]

    await supabaseAdmin
      .from('conversations')
      .update({
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

    // Save AI/Workflow response
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversation.id,
      business_id,
      sender_type: 'agent',
      sender_name: useWorkflow ? 'Workflow Bot' : 'AI Assistant',
      content: responseMessage,
      message_type: 'text',
    })

    // Send response via WhatsApp
    await sendWhatsAppMessage(business_id, phone, responseMessage)

    return NextResponse.json({
      success: true,
      mode: useWorkflow ? 'workflow' : 'ai',
      auto_responded: true,
    })
  } catch (error: any) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process message', message: error.message },
      { status: 500 }
    )
  }
}
