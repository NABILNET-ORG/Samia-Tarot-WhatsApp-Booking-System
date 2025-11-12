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

  // Load ALL business data for comprehensive AI context - EVERYTHING from the app!
  const [aiInstructions, services, knowledgeBase, employees, templates, activeBookings, recentCustomers] = await Promise.all([
    // AI Instructions
    supabaseAdmin
      .from('ai_instructions')
      .select('*')
      .eq('business_id', businessId)
      .single()
      .then((r: any) => r.data),

    // Services
    supabaseAdmin
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('sort_order')
      .then((r: any) => r.data || []),

    // Knowledge Base (website content) - LIMIT to 5 most recent
    supabaseAdmin
      .from('knowledge_base_content')
      .select('source_url, title, content')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('last_updated', { ascending: false })
      .limit(5)
      .then((r: any) => r.data || []),

    // Employees
    supabaseAdmin
      .from('employees')
      .select('full_name, role, email, phone')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .limit(10)
      .then((r: any) => r.data || []),

    // Canned Responses/Templates - LIMIT to 5 most used
    supabaseAdmin
      .from('canned_responses')
      .select('name, content, category')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .limit(5)
      .then((r: any) => r.data || []),

    // Active Bookings (today and upcoming)
    supabaseAdmin
      .from('bookings')
      .select('scheduled_date, status')
      .eq('business_id', businessId)
      .gte('scheduled_date', new Date().toISOString())
      .in('status', ['pending', 'confirmed'])
      .limit(10)
      .then((r: any) => r.data || []),

    // Recent Customers (for context about customer base)
    supabaseAdmin
      .from('customers')
      .select('phone, name_english, vip_status, total_bookings')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then((r: any) => r.data || [])
  ])

  // === BUILD COMPREHENSIVE BUSINESS CONTEXT - EVERYTHING! ===
  let businessContext = `\n\n## ABOUT ${business.name.toUpperCase()}:\n`

  // Core business info
  if (business.description) businessContext += `${business.description}\n\n`
  businessContext += `**Industry:** ${business.industry || 'Service Provider'}\n`

  // Contact information
  businessContext += `\n**CONTACT US:**\n`
  if (business.website_url) businessContext += `- Website: ${business.website_url}\n`
  if (business.support_email) businessContext += `- Email: ${business.support_email}\n`
  if (business.support_phone) businessContext += `- Phone: ${business.support_phone}\n`
  if (business.whatsapp_number) businessContext += `- WhatsApp: ${business.whatsapp_number}\n`

  // Operating hours
  if (business.business_hours_start && business.business_hours_end) {
    businessContext += `\n**BUSINESS HOURS:**\n`
    businessContext += `${business.business_hours_start} - ${business.business_hours_end}\n`
    if (business.days_open) businessContext += `Days: ${business.days_open}\n`
  }

  // Language & Location
  if (business.language_primary || business.timezone) {
    businessContext += `\n**LANGUAGES & LOCATION:**\n`
    if (business.language_primary) businessContext += `- Primary Language: ${business.language_primary}\n`
    if (business.language_secondary) businessContext += `- Also Available: ${business.language_secondary}\n`
    if (business.timezone) businessContext += `- Timezone: ${business.timezone}\n`
  }

  // Payment & Booking Policies
  businessContext += `\n**PAYMENT & BOOKING:**\n`
  if (business.currency) businessContext += `- Currency: ${business.currency}\n`
  if (business.stripe_publishable_key) businessContext += `- Payment Methods: Credit/Debit Card (Stripe), Western Union\n`
  else businessContext += `- Payment Methods: Western Union, Bank Transfer\n`

  // Add subscription/tier info (to know service limitations)
  if (business.subscription_tier) {
    businessContext += `- Service Tier: ${business.subscription_tier}\n`
  }

  // Booking availability info
  if (activeBookings && activeBookings.length > 0) {
    businessContext += `- Upcoming Bookings: ${activeBookings.length} sessions scheduled\n`
  }

  // Services list
  let servicesContext = ''
  if (services.length > 0) {
    servicesContext = '\n\n## AVAILABLE SERVICES:\n'
    services.forEach((s: any, i: number) => {
      servicesContext += `${i + 1}. **${s.name_english}**`
      if (s.name_arabic) servicesContext += ` (${s.name_arabic})`
      servicesContext += `\n   - Price: ${business.currency || '$'}${s.price}`
      if (s.duration_minutes) servicesContext += `\n   - Duration: ${s.duration_minutes} minutes`
      if (s.description_english) servicesContext += `\n   - ${s.description_english}`
      if (s.category) servicesContext += `\n   - Category: ${s.category}`
      servicesContext += '\n'
    })
  }

  // Knowledge base from website - REDUCED to 800 chars per page to fit token limit
  let knowledgeContext = ''
  if (knowledgeBase.length > 0) {
    knowledgeContext = '\n\n## KNOWLEDGE BASE (from website):\n'
    knowledgeBase.forEach((kb: any) => {
      // Extract first 800 chars only (roughly 200 tokens per page × 5 pages = 1000 tokens)
      knowledgeContext += `### ${kb.title}\n${kb.content.substring(0, 800)}\n\n`
    })
  }

  // Team information
  let teamContext = ''
  if (employees.length > 0) {
    teamContext = '\n\n## TEAM MEMBERS:\n'
    employees.forEach((emp: any) => {
      teamContext += `- ${emp.full_name} (${emp.role})\n`
    })
  }

  // Templates/FAQs - Keep short summaries only
  let templatesContext = ''
  if (templates.length > 0) {
    templatesContext = '\n\n## COMMON RESPONSES & FAQs:\n'
    templates.forEach((t: any) => {
      // Limit each template to 150 chars to save tokens
      const shortContent = t.content.substring(0, 150) + (t.content.length > 150 ? '...' : '')
      templatesContext += `**${t.name}** (${t.category}): ${shortContent}\n`
    })
  }

  // Customer insights
  let customerContext = ''
  if (recentCustomers && recentCustomers.length > 0) {
    const totalCustomers = recentCustomers.length
    const vipCount = recentCustomers.filter((c: any) => c.vip_status).length
    customerContext += `\n**CUSTOMER BASE:**\n`
    customerContext += `- Total Customers: ${totalCustomers}+ registered\n`
    if (vipCount > 0) customerContext += `- VIP Customers: ${vipCount}\n`
  }

  // Booking availability
  let bookingContext = ''
  if (activeBookings && activeBookings.length > 0) {
    bookingContext += `\n**BOOKING AVAILABILITY:**\n`
    bookingContext += `- Upcoming bookings: ${activeBookings.length} sessions scheduled\n`
    bookingContext += `- Recommendation: Check calendar for available slots\n`
  } else {
    bookingContext += `\n**BOOKING AVAILABILITY:**\n`
    bookingContext += `- Currently accepting bookings\n`
    bookingContext += `- Flexible scheduling available\n`
  }

  // Build final system prompt - ASSEMBLE EVERYTHING!
  let systemPrompt = ''

  if (aiInstructions?.system_prompt) {
    // Use configured AI instructions - replace ALL placeholders
    systemPrompt = aiInstructions.system_prompt
      .replace(/{business_name}/g, business.name)
      .replace(/{name}/g, business.name)
      .replace(/{industry}/g, business.industry || '')
  } else {
    // Fallback to auto-generated prompt based on business data
    systemPrompt = `You are an AI assistant for ${business.name}.
You help customers with their inquiries and bookings.

**YOUR ROLE:**
- Answer customer questions clearly and professionally
- Guide customers through the booking/purchase process
- Provide accurate information about products/services
- Maintain a helpful and ${aiInstructions?.tone || 'friendly'} tone

**RULES:**
1. Always be polite and professional
2. Stay on topic related to business services
3. Ask for clarification if customer request is unclear
4. Escalate complex issues to human support
5. Remember conversation context
6. Never answer or reply anything not related to the business`
  }

  // === ASSEMBLE COMPLETE CONTEXT ===
  // Order of priority: Instructions → Business Info → Services → Knowledge → Team → FAQs → Bookings → Customers
  systemPrompt = systemPrompt +
    businessContext +
    servicesContext +
    knowledgeContext +
    teamContext +
    templatesContext +
    customerContext +
    bookingContext

  // Build conversation history for context
  const messageHistory = conversation.message_history || []
  const recentHistory = messageHistory.slice(-10) // Last 10 messages

  // Special handling for GREETING state - use greeting template if available
  let aiMessage = ''

  if (currentState === 'GREETING' && aiInstructions?.greeting_template && recentHistory.length === 0) {
    // First message - use configured greeting with business name
    aiMessage = aiInstructions.greeting_template
      .replace('{business_name}', business.name)
      .replace('{name}', business.name)
  } else {
    // Build messages for OpenAI
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ]

    // Call OpenAI - Use gpt-4o for larger context (128k tokens)
    const completion = await openai.chat.completions.create({
      model: business.ai_model || 'gpt-4o',
      messages,
      temperature: business.ai_temperature || 0.7,
      max_tokens: business.ai_max_tokens || 700,
    })

    aiMessage = completion.choices[0].message.content || 'Sorry, I could not understand that.'
  }

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
