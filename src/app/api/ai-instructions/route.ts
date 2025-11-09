/**
 * 🤖 AI Instructions API
 * Manage AI system prompts and behavior settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'
import { UpdateAIInstructionsSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/ai-instructions - Get AI instructions for business
 */
export async function GET(request: NextRequest) {
  return requirePermission(request, 'settings', 'read', async (context) => {
    try {
      const { data: instructions, error } = await supabaseAdmin
        .from('ai_instructions')
        .select('*')
        .eq('business_id', context.business.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned (not an error, just means no instructions yet)
        throw error
      }

      // If no instructions exist, return defaults
      if (!instructions) {
        return NextResponse.json({
          instructions: {
            business_id: context.business.id,
            system_prompt: `You are an AI assistant for ${context.business.name}. You help customers with their inquiries and bookings.

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
          },
        })
      }

      return NextResponse.json({ instructions })
    } catch (error: any) {
      console.error('Failed to get AI instructions:', error)
      return NextResponse.json(
        { error: 'Failed to load AI instructions', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/ai-instructions - Save/update AI instructions
 */
export async function POST(request: NextRequest) {
  return requirePermission(request, 'settings', 'write', async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = UpdateAIInstructionsSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data
      const {
        system_prompt,
        greeting_template,
        tone,
        language_handling,
        response_length,
        special_instructions,
      } = validatedData

      // Check if instructions exist to determine if this is create or update
      const { data: existing } = await supabaseAdmin
        .from('ai_instructions')
        .select('id, system_prompt, greeting_template')
        .eq('business_id', context.business.id)
        .single()

      // For new instructions, require both fields
      if (!existing && (!system_prompt || !greeting_template)) {
        return NextResponse.json(
          { error: 'system_prompt and greeting_template are required for new instructions' },
          { status: 400 }
        )
      }

      // Prepare data for create/update
      let result

      if (existing) {
        // Update existing instructions (partial update)
        const updateData: any = {}
        if (system_prompt !== undefined) updateData.system_prompt = system_prompt
        if (greeting_template !== undefined) updateData.greeting_template = greeting_template
        if (tone !== undefined) updateData.tone = tone
        if (language_handling !== undefined) updateData.language_handling = language_handling
        if (response_length !== undefined) updateData.response_length = response_length
        if (special_instructions !== undefined) updateData.special_instructions = special_instructions
        updateData.updated_at = new Date().toISOString()

        result = await supabaseAdmin
          .from('ai_instructions')
          .update(updateData)
          .eq('business_id', context.business.id)
          .select()
          .single()
      } else {
        // Create new instructions (require all fields)
        result = await supabaseAdmin
          .from('ai_instructions')
          .insert({
            business_id: context.business.id,
            system_prompt: system_prompt!,
            greeting_template: greeting_template!,
            tone: tone || 'friendly',
            language_handling: language_handling || 'auto',
            response_length: response_length || 'balanced',
            special_instructions: special_instructions || '',
          })
          .select()
          .single()
      }

      if (result.error) throw result.error

      return NextResponse.json({
        instructions: result.data,
        message: 'AI instructions saved successfully',
      })
    } catch (error: any) {
      console.error('Failed to save AI instructions:', error)
      return NextResponse.json(
        { error: 'Failed to save AI instructions', message: error.message },
        { status: 500 }
      )
    }
  })
}
