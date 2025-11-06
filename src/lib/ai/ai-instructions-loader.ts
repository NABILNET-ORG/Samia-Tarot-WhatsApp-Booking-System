/**
 * AI Instructions Loader
 * Loads business-specific AI instructions from database
 */

import { supabaseAdmin } from '@/lib/supabase/client'

export interface AIInstructions {
  system_prompt: string
  greeting_template: string
  tone: 'professional' | 'friendly' | 'mystical' | 'casual'
  language_handling: 'auto' | 'english_only' | 'arabic_only' | 'multilingual'
  response_length: 'concise' | 'balanced' | 'detailed'
  special_instructions?: string
}

const DEFAULT_INSTRUCTIONS: AIInstructions = {
  system_prompt: `You are an AI assistant helping customers with their inquiries and bookings.

**YOUR ROLE:**
- Answer customer questions clearly and professionally
- Guide customers through the booking/purchase process
- Provide accurate information about products/services
- Maintain a helpful and friendly tone

**RULES:**
1. Always be polite and professional
2. Stay on topic related to business services
3. Ask for clarification if customer request is unclear
4. Escalate complex issues to human support
5. Remember conversation context`,
  greeting_template: 'Hello! 👋 Welcome to our service. How can I help you today?',
  tone: 'friendly',
  language_handling: 'auto',
  response_length: 'balanced',
  special_instructions: '',
}

export async function loadAIInstructions(businessId: string): Promise<AIInstructions> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_instructions')
      .select('*')
      .eq('business_id', businessId)
      .single()

    if (error || !data) {
      console.log(`No AI instructions found for business ${businessId}, using defaults`)
      return DEFAULT_INSTRUCTIONS
    }

    return {
      system_prompt: data.system_prompt,
      greeting_template: data.greeting_template,
      tone: data.tone,
      language_handling: data.language_handling,
      response_length: data.response_length,
      special_instructions: data.special_instructions || '',
    }
  } catch (error) {
    console.error('Error loading AI instructions:', error)
    return DEFAULT_INSTRUCTIONS
  }
}

export function buildSystemPrompt(instructions: AIInstructions, services?: any[]): string {
  let prompt = instructions.system_prompt

  // Add tone guidance
  const toneGuidance = {
    professional: '\n\n**TONE:** Maintain a professional and business-like demeanor.',
    friendly: '\n\n**TONE:** Be warm, approachable, and conversational.',
    mystical: '\n\n**TONE:** Use mystical, spiritual language with reverence.',
    casual: '\n\n**TONE:** Keep it relaxed and casual, like talking to a friend.',
  }
  prompt += toneGuidance[instructions.tone]

  // Add response length guidance
  const lengthGuidance = {
    concise: '\n\n**RESPONSE LENGTH:** Keep responses brief and to the point.',
    balanced: '\n\n**RESPONSE LENGTH:** Provide balanced responses with necessary detail.',
    detailed: '\n\n**RESPONSE LENGTH:** Give comprehensive, detailed responses.',
  }
  prompt += lengthGuidance[instructions.response_length]

  // Add language handling
  const languageGuidance = {
    auto: '\n\n**LANGUAGE:** Detect and respond in the customer language.',
    english_only: '\n\n**LANGUAGE:** Always respond in English only.',
    arabic_only: '\n\n**LANGUAGE:** Always respond in Arabic only.',
    multilingual: '\n\n**LANGUAGE:** Support multiple languages as needed.',
  }
  prompt += languageGuidance[instructions.language_handling]

  // Add special instructions
  if (instructions.special_instructions) {
    prompt += `\n\n**SPECIAL INSTRUCTIONS:**\n${instructions.special_instructions}`
  }

  // Add services if provided
  if (services && services.length > 0) {
    prompt += '\n\n**AVAILABLE SERVICES:**\n'
    services.forEach(s => {
      const duration = s.duration_minutes ? ` (${s.duration_minutes} min)` : ''
      prompt += `- ${s.name}: $${s.price_amount}${duration}\n`
    })
  }

  return prompt
}
