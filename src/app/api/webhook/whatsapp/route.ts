/**
 * WhatsApp Webhook Handler
 * Handles incoming messages from Meta or Twilio
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getWhatsAppProvider } from '@/lib/whatsapp/factory'
import { ConversationManager } from '@/lib/ai/conversation-manager'

const prisma = new PrismaClient()

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
  try {
    const body = await request.json()
    const provider = getWhatsAppProvider()

    // Log webhook for debugging
    await prisma.webhookLog.create({
      data: {
        provider: provider.getName(),
        event: 'incoming_message',
        payload: body,
        processed: false,
      },
    })

    // Parse incoming message
    const incomingMessage = provider.parseIncomingMessage(body)

    if (!incomingMessage) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }

    const { from, body: messageBody } = incomingMessage

    // Get or create customer
    let customer = await prisma.customer.findUnique({
      where: { phoneNumber: from },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phoneNumber: from,
          language: 'ar', // Default
        },
      })
    }

    // Get or create conversation
    const conversation = await ConversationManager.getOrCreateConversation(customer.id)

    // Build context
    const context = {
      customerPhone: from,
      currentState: conversation.state,
      language: conversation.language as 'ar' | 'en',
      conversationHistory: conversation.messages,
      customerName: customer.nameEn || undefined,
      customerEmail: customer.email || undefined,
    }

    // Analyze message with AI
    const aiResponse = await ConversationManager.analyzeMessage(context, messageBody)

    // Save user message
    await ConversationManager.saveMessage(conversation.id, 'user', messageBody)

    // Save AI response
    await ConversationManager.saveMessage(
      conversation.id,
      'assistant',
      aiResponse.message,
      aiResponse.metadata
    )

    // Update conversation state
    await ConversationManager.updateConversation(conversation.id, {
      state: aiResponse.state,
      language: aiResponse.language,
    })

    // Send response to customer
    await provider.sendMessage({
      to: from,
      body: aiResponse.message,
    })

    // Handle state-specific actions
    await handleStateActions(aiResponse.state, customer.id, aiResponse.metadata)

    // Mark webhook as processed
    await prisma.webhookLog.updateMany({
      where: {
        provider: provider.getName(),
        processed: false,
      },
      data: { processed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)

    // Log error
    await prisma.webhookLog.create({
      data: {
        provider: getWhatsAppProvider().getName(),
        event: 'error',
        payload: { error: error.message },
        processed: false,
        error: error.stack,
      },
    })

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Handle state-specific actions
 */
async function handleStateActions(
  state: string,
  customerId: string,
  metadata?: Record<string, any>
): Promise<void> {
  switch (state) {
    case 'SHOW_SERVICES':
      // Could send services menu with buttons (if using Meta with interactive messages)
      break

    case 'PAYMENT':
      // Initiate payment flow
      // This would trigger Stripe checkout or Western Union instructions
      break

    case 'SUPPORT_REQUEST':
      // Notify admin
      const customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (customer) {
        await notifyAdmin('support_request', {
          phone: customer.phoneNumber,
          name: customer.nameEn || customer.nameAr || 'Unknown',
        })
      }
      break
  }
}

/**
 * Notify admin via WhatsApp
 */
async function notifyAdmin(type: string, data: any): Promise<void> {
  const provider = getWhatsAppProvider()
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || '+9613620860'

  let message = ''
  if (type === 'support_request') {
    message = `🆘 Support Request\n\n👤 ${data.name}\n📱 ${data.phone}\n\nCustomer needs assistance.`
  }

  await provider.sendMessage({
    to: adminPhone,
    body: message,
  })

  // Save notification
  await prisma.notification.create({
    data: {
      type,
      title: 'Support Request',
      message,
      metadata: data,
    },
  })
}
