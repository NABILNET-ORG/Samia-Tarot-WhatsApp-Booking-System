/**
 * 🤖 AI Conversation Engine (Multi-Tenant)
 * Processes incoming WhatsApp messages and generates AI responses
 */

import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/client'
import { decryptApiKey } from '@/lib/encryption/keys'

export type ConversationState =
  | 'GREETING'
  | 'SHOW_SERVICES'
  | 'SERVICE_SELECTED'
  | 'ASK_NAME'
  | 'ASK_EMAIL'
  | 'SELECT_TIME_SLOT'
  | 'PAYMENT'
  | 'GENERAL_QUESTION'
  | 'SUPPORT_REQUEST'

export type AIResponse = {
  message: string
  newState: ConversationState
  actions?: {
    createBooking?: boolean
    requestPayment?: boolean
    scheduleEvent?: boolean
  }
}

/**
 * Process incoming message with AI
 */
export async function processMessageWithAI(
  businessId: string,
  conversationId: string,
  userMessage: string,
  currentState: ConversationState
): Promise<AIResponse> {
  // Load business AI configuration
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single()

  if (!business) {
    throw new Error('Business not found')
  }

  // Get OpenAI API key
  const openaiKey = business.openai_api_key_encrypted
    ? decryptApiKey(business.openai_api_key_encrypted, businessId)
    : process.env.OPENAI_API_KEY

  if (!openaiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const openai = new OpenAI({ apiKey: openaiKey })

  // Load conversation history
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // Load services for this business
  const { data: services } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('sort_order')

  // Load prompt template for current state
  const { data: template } = await supabaseAdmin
    .from('prompt_templates')
    .select('*')
    .eq('business_id', businessId)
    .eq('state_name', currentState)
    .eq('is_active', true)
    .single()

  // Build system prompt
  const systemPrompt = template?.content || getDefaultPrompt(currentState, business, services || [])

  // Build conversation history for context
  const messageHistory = conversation.message_history || []
  const recentHistory = messageHistory.slice(-10) // Last 10 messages

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...recentHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: userMessage },
  ]

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: business.ai_model || 'gpt-4',
    messages,
    temperature: business.ai_temperature || 0.7,
    max_tokens: business.ai_max_tokens || 700,
  })

  const aiMessage = completion.choices[0].message.content || 'Sorry, I could not understand that.'

  // Parse response and determine new state
  const { newState, actions } = parseAIResponse(aiMessage, currentState, conversation)

  return {
    message: aiMessage,
    newState,
    actions,
  }
}

/**
 * Get default prompt if no template exists
 */
function getDefaultPrompt(
  state: ConversationState,
  business: any,
  services: any[]
): string {
  const businessName = business.name || 'Our Business'
  const serviceList = services
    .map((s, i) => `${i + 1}. ${s.name_english} ($${s.price})`)
    .join('\n')

  switch (state) {
    case 'GREETING':
      return `You are a helpful WhatsApp assistant for ${businessName}.
Greet the customer warmly and ask how you can help them today.
Be friendly, professional, and concise.
Customer's language: ${business.language_primary || 'en'}`

    case 'SHOW_SERVICES':
      return `You are a helpful WhatsApp assistant for ${businessName}.
Show the customer our services:

${serviceList}

Ask which service they're interested in.
Be friendly and helpful.`

    case 'SERVICE_SELECTED':
      return `The customer has selected a service.
Ask for their full name to proceed with the booking.
Be polite and reassuring.`

    case 'ASK_NAME':
      return `The customer provided their name.
Now ask for their email address for booking confirmation.`

    case 'ASK_EMAIL':
      return `The customer provided their email.
Now help them select a date and time for their appointment.
Offer a few available time slots.`

    case 'PAYMENT':
      return `The booking is ready.
Explain the payment process and provide payment link.
Be clear about the total amount and payment methods.`

    case 'GENERAL_QUESTION':
      return `You are a knowledgeable assistant for ${businessName}.
Answer the customer's question about our services, pricing, or availability.
Be helpful and accurate.
If you don't know, offer to connect them with a human agent.`

    case 'SUPPORT_REQUEST':
      return `The customer needs support.
Acknowledge their issue and let them know a human agent will assist shortly.
Collect any relevant details.`

    default:
      return `You are a helpful WhatsApp assistant for ${businessName}.
Assist the customer with their inquiry professionally and courteously.`
  }
}

/**
 * Parse AI response to determine next state and actions
 */
function parseAIResponse(
  aiMessage: string,
  currentState: ConversationState,
  conversation: any
): { newState: ConversationState; actions?: any } {
  // Simple state machine logic
  // In production, use more sophisticated parsing

  const hasName = conversation.full_name && conversation.full_name.length > 0
  const hasEmail = conversation.email && conversation.email.length > 0
  const hasService = conversation.selected_service !== null

  switch (currentState) {
    case 'GREETING':
      return { newState: 'SHOW_SERVICES' }

    case 'SHOW_SERVICES':
      if (hasService) {
        return { newState: 'SERVICE_SELECTED' }
      }
      return { newState: 'SHOW_SERVICES' }

    case 'SERVICE_SELECTED':
      if (!hasName) {
        return { newState: 'ASK_NAME' }
      }
      return { newState: 'ASK_EMAIL' }

    case 'ASK_NAME':
      if (hasName) {
        return { newState: 'ASK_EMAIL' }
      }
      return { newState: 'ASK_NAME' }

    case 'ASK_EMAIL':
      if (hasEmail) {
        return {
          newState: 'SELECT_TIME_SLOT',
          actions: { createBooking: true },
        }
      }
      return { newState: 'ASK_EMAIL' }

    case 'SELECT_TIME_SLOT':
      return {
        newState: 'PAYMENT',
        actions: { requestPayment: true },
      }

    case 'PAYMENT':
      return {
        newState: 'GREETING',
        actions: {},
      }

    default:
      return { newState: currentState }
  }
}
