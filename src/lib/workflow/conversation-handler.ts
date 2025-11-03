/**
 * 🤖 Complete Conversation Handler
 * Replaces n8n workflow with intelligent Next.js backend
 */

import OpenAI from 'openai'
import { supabaseAdmin, supabaseHelpers } from '@/lib/supabase/client'
import { ServiceHelpers, Service } from '@/lib/supabase/services'
import { getWhatsAppProvider } from '@/lib/whatsapp/factory'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
})

export type ConversationState =
  | 'GREETING'
  | 'LANGUAGE_SELECTION'
  | 'GENERAL_QUESTION'
  | 'SHOW_SERVICES'
  | 'SERVICE_SELECTED'
  | 'ASK_NAME'
  | 'ASK_EMAIL'
  | 'PAYMENT'
  | 'PAYMENT_COMPLETED'
  | 'SUPPORT_REQUEST'

export class ConversationHandler {
  /**
   * Main entry point - handle incoming WhatsApp message
   */
  static async handleMessage(phone: string, message: string): Promise<void> {
    try {
      // 1. Get or create customer
      const customer = await supabaseHelpers.getOrCreateCustomer(phone)

      // 2. Load active conversation (with memory!)
      let conversation = await supabaseHelpers.getActiveConversation(phone)

      if (!conversation) {
        // Create new conversation
        conversation = await supabaseHelpers.upsertConversation(phone, {
          customer_id: customer.id,
          current_state: 'GREETING',
          language: 'ar',
        })
      }

      // 3. Add user message to history
      await supabaseHelpers.addMessageToHistory(conversation.id, 'user', message)

      // 4. Track analytics
      await supabaseHelpers.trackEvent('message_received', {
        customer_id: customer.id,
        phone,
        language: conversation.language,
      })

      // 5. Analyze message with AI
      const aiResponse = await this.analyzeWithAI(conversation, customer, message)

      // 6. Save AI response to history
      await supabaseHelpers.addMessageToHistory(conversation.id, 'assistant', aiResponse.message)

      // 7. Update conversation state
      await supabaseHelpers.upsertConversation(phone, {
        current_state: aiResponse.state,
        language: aiResponse.language,
        ...aiResponse.updates,
      })

      // 8. Send response via WhatsApp
      const provider = getWhatsAppProvider()
      await provider.sendMessage({
        to: phone,
        body: aiResponse.message,
      })

      // 9. Handle state-specific actions
      await this.handleStateActions(aiResponse.state, customer, conversation, aiResponse)
    } catch (error: any) {
      console.error('Conversation handler error:', error)

      // Send error message to customer
      const provider = getWhatsAppProvider()
      await provider.sendMessage({
        to: phone,
        body: 'عذراً، حدث خطأ. سيتم توصيلك بالدعم.\nSorry, an error occurred. You will be connected to support.',
      })

      // Log error
      await supabaseHelpers.logWebhook({
        provider: provider.getName(),
        event_type: 'conversation_error',
        payload: { error: error.message, phone },
        error: error.stack,
      })
    }
  }

  /**
   * Analyze message with AI (GPT-4)
   */
  private static async analyzeWithAI(
    conversation: any,
    customer: any,
    message: string
  ): Promise<{
    state: ConversationState
    language: 'ar' | 'en'
    message: string
    updates?: any
    metadata?: any
  }> {
    // Get all services from database
    const services = await ServiceHelpers.getActiveServices()

    // Build system prompt
    const systemPrompt = `You are Samia Tarot's AI assistant for WhatsApp bookings.

**SERVICES AVAILABLE (FROM DATABASE):**
${services.map(s => `- ID ${s.id}: ${s.name_english} (${s.name_arabic}) - $${s.price} [${s.service_type}]`).join('\n')}

**SERVICE DETAILS:**
- Coffee Cup: Spiritual reading from coffee cup patterns
- Tarot: Card reading revealing past/present/future
- Rune: Ancient symbols guidance
- Calls: Direct video/phone sessions with Samia
- Video: Recorded video readings

**DELIVERY SCHEDULE:**
- Standard ($50-$100): 1-2 days
- Premium ($75-$150): Same/next day
- Golden ($100-$250): Same day (if paid before 7 PM)
- Video ($120-$250): 1 day
- Calls: Scheduled at customer's chosen time (12 PM - 8 PM)

**YOUR CAPABILITIES:**
1. Detect language (Arabic or English)
2. Answer general questions about services
3. Show services menu from database
4. Guide through booking process
5. Never ask for info you already have

**CONVERSATION STATES:**
- GREETING: Welcome new customer
- LANGUAGE_SELECTION: Ask language preference
- GENERAL_QUESTION: Answer questions
- SHOW_SERVICES: Display service menu
- SERVICE_SELECTED: Customer picked service
- ASK_NAME: Request name (if not in database)
- ASK_EMAIL: Request email (if not in database)
- PAYMENT: Process payment
- SUPPORT_REQUEST: Connect to human

**CURRENT CONTEXT:**
- Customer Phone: ${customer.phone}
- Current State: ${conversation.current_state}
- Language: ${conversation.language || 'unknown'}
- Name: ${customer.name_english || 'not provided'}
- Email: ${customer.email || 'not provided'}
- Selected Service: ${conversation.service_name || 'none'}

**RESPONSE FORMAT (JSON):**
{
  "state": "NEXT_STATE",
  "language": "ar" or "en",
  "message": "Your response to customer",
  "metadata": {
    "selectedServiceId": 6,
    "skipName": true,
    "skipEmail": true
  }
}

**RULES:**
1. Be warm and mystical
2. Speak in customer's language
3. Don't ask for info you have
4. Guide smoothly through booking
5. Answer questions confidently`

    // Build messages for GPT
    const messages: any[] = [{ role: 'system', content: systemPrompt }]

    // Add conversation history
    const history = conversation.message_history || []
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    // Call GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content || '{}'
    const aiResponse = JSON.parse(responseText)

    // Validate
    if (!aiResponse.state || !aiResponse.language || !aiResponse.message) {
      throw new Error('Invalid AI response')
    }

    // Extract updates from metadata
    const updates: any = {}
    if (aiResponse.metadata?.selectedServiceId) {
      const service = await ServiceHelpers.getServiceById(aiResponse.metadata.selectedServiceId)
      if (service) {
        updates.selected_service = service.id
        updates.service_name = service.name_english
      }
    }

    return {
      state: aiResponse.state as ConversationState,
      language: aiResponse.language as 'ar' | 'en',
      message: aiResponse.message,
      updates,
      metadata: aiResponse.metadata,
    }
  }

  /**
   * Handle state-specific actions
   */
  private static async handleStateActions(
    state: ConversationState,
    customer: any,
    conversation: any,
    aiResponse: any
  ): Promise<void> {
    const provider = getWhatsAppProvider()

    switch (state) {
      case 'SHOW_SERVICES':
        // Track service menu viewed
        await supabaseHelpers.trackEvent('service_menu_viewed', {
          customer_id: customer.id,
          phone: customer.phone,
          language: conversation.language,
        })
        break

      case 'SERVICE_SELECTED':
        // Track service selection
        if (aiResponse.metadata?.selectedServiceId) {
          await supabaseHelpers.trackEvent('service_selected', {
            customer_id: customer.id,
            phone: customer.phone,
            service_id: aiResponse.metadata.selectedServiceId,
          })
        }
        break

      case 'PAYMENT':
        // Handle payment logic here
        await this.handlePayment(customer, conversation)
        break

      case 'SUPPORT_REQUEST':
        // Notify admin
        await supabaseHelpers.notifyAdmin(
          'support_request',
          'Customer Support Request',
          `Customer ${customer.name_english || customer.phone} needs assistance.`,
          {
            priority: 'high',
            relatedCustomerId: customer.id,
            metadata: { phone: customer.phone },
          }
        )

        // Send to admin via WhatsApp
        const adminPhone = process.env.ADMIN_PHONE_NUMBER || '+9613620860'
        await provider.sendMessage({
          to: adminPhone,
          body: `🆘 Support Request\n\n👤 ${customer.name_english || 'Customer'}\n📱 ${customer.phone}\n\nNeeds assistance.`,
        })
        break
    }
  }

  /**
   * Handle payment processing
   */
  private static async handlePayment(customer: any, conversation: any): Promise<void> {
    // Get selected service
    const service = await ServiceHelpers.getServiceById(conversation.selected_service)
    if (!service) {
      throw new Error('Service not found')
    }

    // Check if NOCARD country (for Western Union option)
    const isNOCARD = this.isNOCARDCountry(customer.phone)

    const provider = getWhatsAppProvider()

    if (isNOCARD) {
      // Offer choice: Stripe or Western Union
      const message = conversation.language === 'ar'
        ? `💳 اختر طريقة الدفع:\n\n1️⃣ بطاقة ائتمان (Stripe)\n2️⃣ ويسترن يونيون\n\nالمبلغ: $${service.price}\n\nاكتب رقم الطريقة:`
        : `💳 Choose Payment Method:\n\n1️⃣ Credit Card (Stripe)\n2️⃣ Western Union\n\nAmount: $${service.price}\n\nType method number:`

      await provider.sendMessage({
        to: customer.phone,
        body: message,
      })
    } else {
      // Create Stripe checkout
      await this.createStripeCheckout(customer, service, conversation.language)
    }

    // Track payment initiated
    await supabaseHelpers.trackEvent('payment_initiated', {
      customer_id: customer.id,
      phone: customer.phone,
      service_id: service.id,
      amount: service.price,
    })
  }

  /**
   * Create Stripe checkout session
   */
  private static async createStripeCheckout(
    customer: any,
    service: Service,
    language: 'ar' | 'en'
  ): Promise<void> {
    // This will be implemented with Stripe integration
    // For now, send placeholder
    const provider = getWhatsAppProvider()
    const message =
      language === 'ar'
        ? `🔗 رابط الدفع سيتم إرساله قريباً...\n\nالخدمة: ${service.name_arabic}\nالمبلغ: $${service.price}`
        : `🔗 Payment link coming soon...\n\nService: ${service.name_english}\nAmount: $${service.price}`

    await provider.sendMessage({
      to: customer.phone,
      body: message,
    })
  }

  /**
   * Check if phone is from NOCARD country (Western Union available)
   * NOCARD Countries: Algeria, Egypt, Iraq, Lebanon, Libya, Morocco, Syria, Tunisia, Yemen
   */
  private static isNOCARDCountry(phone: string): boolean {
    const nocardPrefixes = ['+213', '+20', '+964', '+961', '+218', '+212', '+963', '+216', '+967']
    return nocardPrefixes.some((prefix) => phone.startsWith(prefix))
  }
}
