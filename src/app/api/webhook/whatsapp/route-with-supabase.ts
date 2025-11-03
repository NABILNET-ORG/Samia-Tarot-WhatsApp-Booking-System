/**
 * 🔮 WhatsApp Webhook Handler with Supabase Integration
 * Handles incoming messages from Meta or Twilio
 * Stores everything in Supabase for conversation memory!
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
})

const SERVICES = [
  { id: 1, nameAr: 'قراءة الفنجان العادية', nameEn: 'Standard Coffee Cup Reading', price: 50, type: 'reading', tier: 'standard' },
  { id: 2, nameAr: 'قراءة الفنجان المميزة', nameEn: 'Premium Coffee Cup Reading', price: 100, type: 'reading', tier: 'premium' },
  { id: 3, nameAr: 'قراءة الفنجان الذهبية', nameEn: 'Golden Coffee Cup Reading', price: 200, type: 'reading', tier: 'golden' },
  { id: 4, nameAr: 'قراءة التاروت العادية', nameEn: 'Standard Tarot Reading', price: 50, type: 'reading', tier: 'standard' },
  { id: 5, nameAr: 'قراءة التاروت المميزة', nameEn: 'Premium Tarot Reading', price: 100, type: 'reading', tier: 'premium' },
  { id: 6, nameAr: 'قراءة التاروت الذهبية', nameEn: 'Golden Tarot Reading', price: 200, type: 'reading', tier: 'golden' },
  { id: 7, nameAr: 'قراءة الرون العادية', nameEn: 'Standard Rune Reading', price: 50, type: 'reading', tier: 'standard' },
  { id: 8, nameAr: 'قراءة الرون المميزة', nameEn: 'Premium Rune Reading', price: 100, type: 'reading', tier: 'premium' },
  { id: 9, nameAr: 'قراءة الرون الذهبية', nameEn: 'Golden Rune Reading', price: 200, type: 'reading', tier: 'golden' },
  { id: 10, nameAr: 'اتصال مباشر (30 دقيقة)', nameEn: 'Direct Call (30 min)', price: 150, type: 'call', tier: 'video', duration: 30 },
  { id: 11, nameAr: 'اتصال مميز (45 دقيقة)', nameEn: 'Premium Call (45 min)', price: 200, type: 'call', tier: 'video', duration: 45 },
  { id: 12, nameAr: 'اتصال ذهبي (60 دقيقة)', nameEn: 'Golden Call (60 min)', price: 250, type: 'call', tier: 'video', duration: 60 },
  { id: 13, nameAr: 'طلب دعم', nameEn: 'Support Request', price: 0, type: 'support', tier: 'standard' },
]

const SYSTEM_PROMPT = `You are Samia Tarot's AI assistant. You help customers book spiritual reading services via WhatsApp.

**SERVICES:**
${SERVICES.map(s => `- ${s.nameEn} (${s.nameAr}): $${s.price}`).join('\n')}

**YOUR JOB:**
1. Answer questions about services
2. Guide booking process
3. Maintain conversation context
4. Stay on topic (Samia Tarot only)

**RESPONSE FORMAT (JSON):**
{
  "state": "CURRENT_STATE",
  "language": "ar" or "en",
  "message": "your response",
  "metadata": {}
}

**STATES:** GREETING, GENERAL_QUESTION, SHOW_SERVICES, ASK_NAME, ASK_EMAIL, PAYMENT, SUPPORT_REQUEST`

/**
 * GET - Webhook verification (Meta only)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const provider = getWhatsAppProvider()

  if (provider.getName() === 'meta') {
    const MetaProvider = provider as any
    const result = MetaProvider.verifyWebhookGet?.(mode, token, challenge)

    if (result) {
      return new NextResponse(result, { status: 200 })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST - Handle incoming messages
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const provider = getWhatsAppProvider()

    // 📝 Log webhook to Supabase
    await supabaseHelpers.logWebhook({
      provider: provider.getName(),
      event_type: 'incoming_message',
      payload: body,
      processed: false,
    })

    // Parse incoming message
    const incomingMessage = provider.parseIncomingMessage(body)

    if (!incomingMessage) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }

    const { from, body: messageBody } = incomingMessage

    // 🎯 Track event: message_received
    await supabaseHelpers.trackEvent('message_received', {
      phone: from,
      metadata: { message_length: messageBody.length },
    })

    // 👤 Get or create customer in Supabase
    const customer = await supabaseHelpers.getOrCreateCustomer(from)

    // 💬 Get active conversation (conversation memory!)
    let conversation = await supabaseHelpers.getActiveConversation(from)

    if (!conversation) {
      // Create new conversation
      conversation = await supabaseHelpers.upsertConversation(from, {
        customer_id: customer.id,
        current_state: 'GREETING',
        language: customer.preferred_language || 'ar',
      })
    }

    // 🧠 Add user message to history
    await supabaseHelpers.addMessageToHistory(conversation.id, 'user', messageBody)

    // 🤖 Call GPT-4 with full conversation context
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    // Add conversation history
    for (const msg of conversation.message_history || []) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Add current context
    const contextInfo = `
Current State: ${conversation.current_state}
Language: ${conversation.language}
Customer: ${customer.name_english || 'Unknown'}
${conversation.service_name ? `Selected Service: ${conversation.service_name}` : ''}
    `.trim()

    messages.push({ role: 'system', content: contextInfo })

    // Add user's new message
    messages.push({ role: 'user', content: messageBody })

    // Call GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content || '{}'
    const aiResponse = JSON.parse(responseText)

    // Validate AI response
    if (!aiResponse.state || !aiResponse.language || !aiResponse.message) {
      throw new Error('Invalid AI response format')
    }

    // 💾 Save AI response to history
    await supabaseHelpers.addMessageToHistory(conversation.id, 'assistant', aiResponse.message)

    // 🔄 Update conversation state
    await supabaseHelpers.upsertConversation(from, {
      current_state: aiResponse.state,
      language: aiResponse.language,
      ...aiResponse.metadata,
    })

    // 📊 Track state change
    await supabaseHelpers.trackEvent(`state_${aiResponse.state.toLowerCase()}`, {
      phone: from,
      customer_id: customer.id,
      language: aiResponse.language,
    })

    // 📱 Send response via WhatsApp
    await provider.sendMessage({
      to: from,
      body: aiResponse.message,
    })

    // 🎬 Handle state-specific actions
    await handleStateActions(aiResponse.state, customer, conversation, aiResponse.metadata)

    // ✅ Mark webhook as processed
    const processingTime = Date.now() - startTime

    await supabaseHelpers.logWebhook({
      provider: provider.getName(),
      event_type: 'processed',
      payload: { success: true },
      processed: true,
      processing_time_ms: processingTime,
    })

    return NextResponse.json({
      success: true,
      processing_time_ms: processingTime,
    })
  } catch (error: any) {
    console.error('Webhook error:', error)

    // Log error to Supabase
    await supabaseHelpers.logWebhook({
      provider: getWhatsAppProvider().getName(),
      event_type: 'error',
      payload: { error: error.message },
      processed: false,
      error: error.stack,
      processing_time_ms: Date.now() - startTime,
    })

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Handle state-specific actions
 */
async function handleStateActions(
  state: string,
  customer: any,
  conversation: any,
  metadata?: any
): Promise<void> {
  switch (state) {
    case 'SHOW_SERVICES':
      // Track service menu viewed
      await supabaseHelpers.trackEvent('service_menu_viewed', {
        phone: customer.phone,
        customer_id: customer.id,
        language: conversation.language,
      })
      break

    case 'ASK_NAME':
      // Customer selected a service
      if (metadata?.service_id) {
        await supabaseHelpers.trackEvent('service_selected', {
          phone: customer.phone,
          customer_id: customer.id,
          service_id: metadata.service_id,
          service_name: metadata.service_name,
        })
      }
      break

    case 'PAYMENT':
      // Customer ready for payment
      await supabaseHelpers.trackEvent('payment_initiated', {
        phone: customer.phone,
        customer_id: customer.id,
        service_id: conversation.selected_service,
      })

      // You would create Stripe checkout here and save to Supabase
      break

    case 'SUPPORT_REQUEST':
      // Notify admin
      await supabaseHelpers.notifyAdmin(
        'support_request',
        'Support Request',
        `Customer ${customer.name_english || customer.phone} needs assistance.`,
        {
          priority: 'high',
          relatedCustomerId: customer.id,
          metadata: { phone: customer.phone },
        }
      )

      // Track event
      await supabaseHelpers.trackEvent('support_requested', {
        phone: customer.phone,
        customer_id: customer.id,
      })
      break
  }
}
