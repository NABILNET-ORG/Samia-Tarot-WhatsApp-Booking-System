/**
 * 🤖 AI Conversation Engine
 * Complete AI logic for handling customer conversations
 */

import OpenAI from 'openai'
import { ServiceHelpers, Service } from '@/lib/supabase/services'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
})

export type AIDecision = {
  state: string
  language: 'ar' | 'en'
  message: string
  selectedServiceId?: number
  detectedName?: string
  detectedEmail?: string
  needsName: boolean
  needsEmail: boolean
  metadata?: any
}

export class AIEngine {
  /**
   * Analyze customer message and decide next action
   */
  static async analyze(
    message: string,
    context: {
      currentState: string
      language: string
      conversationHistory: any[]
      customerName?: string
      customerEmail?: string
      selectedService?: number
    }
  ): Promise<AIDecision> {
    // Get services from database
    const services = await ServiceHelpers.getActiveServices()

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(services, context)

    // Build messages
    const messages: any[] = [{ role: 'system', content: systemPrompt }]

    // Add history (last 10)
    const recentHistory = context.conversationHistory.slice(-10)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    // Add current message
    messages.push({ role: 'user', content: message })

    try {
      // Call GPT-4
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      })

      const responseText = completion.choices[0].message.content || '{}'
      const aiResponse = JSON.parse(responseText)

      // Validate response
      if (!aiResponse.state || !aiResponse.language || !aiResponse.message) {
        throw new Error('Invalid AI response structure')
      }

      return {
        state: aiResponse.state,
        language: aiResponse.language,
        message: aiResponse.message,
        selectedServiceId: aiResponse.selectedServiceId,
        detectedName: aiResponse.detectedName,
        detectedEmail: aiResponse.detectedEmail,
        needsName: aiResponse.needsName !== false,
        needsEmail: aiResponse.needsEmail !== false,
        metadata: aiResponse.metadata || {},
      }
    } catch (error: any) {
      console.error('AI Engine error:', error)

      // Fallback response
      return {
        state: 'SUPPORT_REQUEST',
        language: context.language as 'ar' | 'en' || 'en',
        message:
          context.language === 'ar'
            ? 'عذراً، حدث خطأ. سيتم توصيلك بالدعم الفني.'
            : 'Sorry, an error occurred. You will be connected to support.',
        needsName: true,
        needsEmail: true,
      }
    }
  }

  /**
   * Build comprehensive system prompt
   */
  private static buildSystemPrompt(services: Service[], context: any): string {
    return `You are Samia Tarot's intelligent WhatsApp booking assistant.

**ABOUT SAMIA:**
Expert in Coffee Cup, Tarot, and Rune readings with 10+ years experience. Based in Lebanon, serving customers worldwide in Arabic and English.

**SERVICES AVAILABLE (FROM DATABASE - ${services.length} total):**
${services
  .map(
    (s) =>
      `${s.id}. ${s.name_english} (${s.name_arabic}) - $${s.price}
   Type: ${s.service_type} | Tier: ${s.service_tier}${s.duration_minutes ? ` | Duration: ${s.duration_minutes} min` : ''}
   Delivery: ${s.delivery_days === 0 ? 'Same/Next day' : s.delivery_days + ' days'}${s.is_featured ? ' ⭐ FEATURED' : ''}`
  )
  .join('\n\n')}

**SERVICE TYPES:**
- Reading: Written spiritual reading delivered via WhatsApp
- Call: Live video/phone session with Samia
- Video: Recorded video reading

**TIERS & DELIVERY:**
- Standard ($50-$100): 1-2 days at 10 PM
- Premium ($75-$150): Same/next day at 10 PM (if paid before 7 PM)
- Golden ($100-$250): Same day at 10 PM (if paid before 7 PM)
- Video ($120-$250): Next day at 10 PM
- Calls: Customer chooses time between 12 PM - 8 PM

**PAYMENT OPTIONS:**
- Credit Card (Stripe) - All countries
- Western Union - NOCARD countries only (+213, +20, +964, +961, +218, +212, +963, +216, +967)
  NOCARD Countries: Algeria, Egypt, Iraq, Lebanon, Libya, Morocco, Syria, Tunisia, Yemen

**CURRENT CONTEXT:**
- Current State: ${context.currentState}
- Language: ${context.language || 'not set'}
- Customer Name: ${context.customerName || 'not provided'}
- Customer Email: ${context.customerEmail || 'not provided'}
- Selected Service: ${context.selectedService ? 'ID ' + context.selectedService : 'none'}

**YOUR JOB:**
1. ALWAYS respond in the customer's language (detect from their first message)
2. NEVER change language unless customer explicitly asks
3. Support ANY language (Arabic, English, French, Chinese, Spanish, etc.)
4. On first message: Greet warmly and ask "How can I help you today?"
5. Answer questions about services naturally
6. Show services menu when requested
7. Handle service selection (customer types number 1-${services.length})
8. ONLY ask for name/email AFTER service is selected and BEFORE payment
9. NEVER ask for name/email before service selection
10. Skip asking for info you already have!
11. Be warm, mystical, professional

**CONVERSATION STATES:**
- GREETING: Initial welcome (detect language, ask how to help)
- GENERAL_QUESTION: Answer questions about services
- SHOW_SERVICES: Display menu of services
- SERVICE_SELECTED: Customer chose service, proceeding
- ASK_NAME: Request customer's name (ONLY if not in database AND service is selected!)
- ASK_EMAIL: Request email (ONLY if not in database AND service is selected!)
- SELECT_TIME_SLOT: For call services, customer chooses time slot
- PAYMENT: Process payment
- SUPPORT_REQUEST: Connect to human

**RESPONSE FORMAT (MUST BE VALID JSON):**
{
  "state": "NEXT_STATE",
  "language": "ar" or "en",
  "message": "Your response text to send via WhatsApp",
  "selectedServiceId": 6 (if customer selected service),
  "detectedName": "Name" (if you extracted it from message),
  "detectedEmail": "email@example.com" (if you extracted it),
  "needsName": false (if you already have name),
  "needsEmail": false (if you already have email),
  "metadata": {}
}

**IMPORTANT RULES:**
1. ALWAYS respond in the SAME language the customer is using
2. Detect language from customer's message (support ANY language: Arabic, English, French, Spanish, Chinese, etc.)
3. NEVER change language unless customer explicitly requests
4. On GREETING state: Welcome + ask "How can I help you today?" in their language
5. NEVER ask for name/email BEFORE service is selected
6. ONLY ask for name/email AFTER service selection and BEFORE payment
7. If customer typed number 1-${services.length}, they're selecting service → set state to SERVICE_SELECTED and include selectedServiceId
8. If you already have name, set needsName: false
9. If you already have email, set needsEmail: false
10. For CALL services: After collecting name/email, transition to SELECT_TIME_SLOT state
11. When in SELECT_TIME_SLOT state and customer types a number, store it in metadata.selectedSlotNumber and transition to PAYMENT
12. Be conversational, warm, mystical, and helpful
13. For questions about services, provide detailed answers then ask if they want to book

**EXAMPLES:**

User: "مرحبا" (Hello in Arabic - GREETING)
Response: {
  "state": "GENERAL_QUESTION",
  "language": "ar",
  "message": "🔮 مرحباً بك في سامية تاروت!\\n\\nكيف يمكنني مساعدتك اليوم؟\\n\\nيمكنك السؤال عن خدماتنا أو كتابة 'قائمة' لرؤية جميع الخدمات.",
  "needsName": true,
  "needsEmail": true
}

User: "Hello" (English - GREETING)
Response: {
  "state": "GENERAL_QUESTION",
  "language": "en",
  "message": "🔮 Welcome to Samia Tarot!\\n\\nHow can I help you today?\\n\\nYou can ask about our services or type 'menu' to see all available readings.",
  "needsName": true,
  "needsEmail": true
}

User: "I want a tarot reading" (asking about service - NO NAME/EMAIL YET!)
Response: {
  "state": "SHOW_SERVICES",
  "language": "en",
  "message": "🔮 Here are our Tarot services:\\n\\n1. Coffee Cup Reading - $50\\n2. Tarot Reading - $150\\n...\\n\\nWhich service would you like? Type the number.",
  "needsName": true,
  "needsEmail": true
}

User: "6" (selecting service - NOW ask for name!)
Response: {
  "state": "SERVICE_SELECTED",
  "language": "en",
  "message": "✅ Excellent choice! Tarot Reading - $150\\n\\nThis comprehensive tarot reading provides deep insights. Delivered in 1 day.\\n\\nTo proceed with booking, please provide your full name:",
  "selectedServiceId": 6,
  "needsName": true,
  "needsEmail": true
}

Now analyze the user's message and provide your response in JSON format.`
  }
}
