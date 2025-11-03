/**
 * AI Conversation Manager with GPT-4
 * Handles intelligent conversation flow with memory
 */

import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ConversationContext {
  customerPhone: string
  currentState: string
  language: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  selectedService?: string
  customerName?: string
  customerEmail?: string
}

export interface AIResponse {
  state: string
  language: string
  message: string
  metadata?: Record<string, any>
}

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

const SYSTEM_PROMPT = `You are Samia Tarot's AI assistant for WhatsApp booking. You help customers book spiritual reading services.

**ABOUT SAMIA TAROT:**
- Expert in Coffee Cup Reading, Tarot, and Rune readings
- Offers both written readings (delivered via WhatsApp) and video calls
- Operating hours for calls: 12 PM - 8 PM (Beirut time)
- Bilingual: Arabic & English

**SERVICES AVAILABLE:**
${SERVICES.map(s => `- ${s.nameEn} (${s.nameAr}): $${s.price}${s.duration ? ` - ${s.duration} min` : ''}`).join('\n')}

**SERVICE TIERS:**
- Standard ($50): Delivered in 2 days at 10 PM
- Premium ($100): Delivered same/next day at 10 PM (if paid before 7 PM, same day)
- Golden ($200): Delivered same/next day at 10 PM (if paid before 7 PM, same day)
- Calls: Scheduled at customer's chosen time slot

**YOUR CAPABILITIES:**
1. Answer general questions about services, pricing, delivery times
2. Guide customers through booking process
3. Explain differences between service tiers
4. Provide availability information for calls
5. Maintain conversation context and remember what was discussed

**CONVERSATION STATES:**
- GREETING: Welcome new customers, detect language
- GENERAL_QUESTION: Answer questions about services/process
- SHOW_SERVICES: Display service menu
- ASK_NAME: Request customer's name (skip if we have it)
- ASK_EMAIL: Request customer's email
- PAYMENT: Process payment
- SUPPORT_REQUEST: Route to human support

**RULES:**
1. Always maintain the conversation language (Arabic or English)
2. Be warm, mystical, and professional
3. Don't ask for information you already have
4. Stay on topic (Samia Tarot services only)
5. For call services, mention availability is 12 PM - 8 PM
6. Explain payment methods: Stripe (international) or Western Union (MENA countries)

**RESPONSE FORMAT:**
Analyze the conversation and respond with:
{
  "state": "CURRENT_STATE",
  "language": "ar" or "en",
  "message": "Your response to the customer",
  "metadata": { any additional context }
}

Use conversation history to avoid repeating questions and maintain natural flow.`

export class ConversationManager {
  /**
   * Analyze customer message and generate AI response
   */
  static async analyzeMessage(context: ConversationContext, userMessage: string): Promise<AIResponse> {
    try {
      // Build conversation history for GPT
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
      ]

      // Add conversation history (last 10 turns)
      const recentHistory = context.conversationHistory.slice(-10)
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      }

      // Add current context
      const contextInfo = `
Current State: ${context.currentState}
Language: ${context.language}
Customer Phone: ${context.customerPhone}
${context.selectedService ? `Selected Service: ${context.selectedService}` : ''}
${context.customerName ? `Customer Name: ${context.customerName}` : ''}
${context.customerEmail ? `Customer Email: ${context.customerEmail}` : ''}
      `.trim()

      messages.push({ role: 'system', content: contextInfo })

      // Add user's current message
      messages.push({ role: 'user', content: userMessage })

      // Call GPT-4
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      })

      const responseText = completion.choices[0].message.content || '{}'
      const aiResponse: AIResponse = JSON.parse(responseText)

      // Validate response
      if (!aiResponse.state || !aiResponse.language || !aiResponse.message) {
        throw new Error('Invalid AI response format')
      }

      return aiResponse
    } catch (error: any) {
      console.error('AI conversation error:', error)

      // Fallback response
      return {
        state: 'SUPPORT_REQUEST',
        language: context.language || 'en',
        message: context.language === 'ar'
          ? 'عذراً، حدث خطأ. سيتم توصيلك بالدعم الفني.'
          : 'Sorry, an error occurred. You will be connected to support.',
      }
    }
  }

  /**
   * Save message to conversation history
   */
  static async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await prisma.conversationMessage.create({
      data: {
        conversationId,
        role,
        content,
        metadata: metadata || {},
      },
    })
  }

  /**
   * Get or create conversation
   */
  static async getOrCreateConversation(customerId: string): Promise<{
    id: string
    state: string
    language: string
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>
  }> {
    // Find active conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId,
        active: true,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages
        },
      },
    })

    // Create new conversation if none exists
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          customerId,
          state: 'GREETING',
          language: 'ar', // Default to Arabic
          active: true,
        },
        include: {
          messages: true,
        },
      })
    }

    return {
      id: conversation.id,
      state: conversation.state,
      language: conversation.language,
      messages: conversation.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt,
      })),
    }
  }

  /**
   * Update conversation state
   */
  static async updateConversation(
    conversationId: string,
    updates: { state?: string; language?: string }
  ): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Get service by ID or name
   */
  static getService(identifier: string | number) {
    if (typeof identifier === 'number') {
      return SERVICES.find(s => s.id === identifier)
    }
    return SERVICES.find(
      s => s.nameEn.toLowerCase().includes(identifier.toLowerCase()) ||
           s.nameAr.includes(identifier)
    )
  }

  /**
   * Get all services formatted for display
   */
  static getServicesFormatted(language: 'ar' | 'en'): string {
    return SERVICES
      .filter(s => s.type !== 'support')
      .map((s, idx) => {
        const name = language === 'ar' ? s.nameAr : s.nameEn
        return `${idx + 1}. ${name} - $${s.price}`
      })
      .join('\n')
  }
}
