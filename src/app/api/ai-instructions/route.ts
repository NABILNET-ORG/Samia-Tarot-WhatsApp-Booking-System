/**
 * 🤖 AI Instructions API
 * Manage AI system prompts and behavior settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requirePermission } from '@/lib/multi-tenant/middleware'

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
      const {
        system_prompt,
        greeting_template,
        tone,
        language_handling,
        response_length,
        special_instructions,
      } = body

      // Validate required fields
      if (!system_prompt || !greeting_template) {
        return NextResponse.json(
          { error: 'system_prompt and greeting_template are required' },
          { status: 400 }
        )
      }

      // Check if instructions exist
      const { data: existing } = await supabaseAdmin
        .from('ai_instructions')
        .select('id')
        .eq('business_id', context.business.id)
        .single()

      let result

      if (existing) {
        // Update existing instructions
        result = await supabaseAdmin
          .from('ai_instructions')
          .update({
            system_prompt,
            greeting_template,
            tone,
            language_handling,
            response_length,
            special_instructions,
            updated_at: new Date().toISOString(),
          })
          .eq('business_id', context.business.id)
          .select()
          .single()
      } else {
        // Create new instructions
        result = await supabaseAdmin
          .from('ai_instructions')
          .insert({
            business_id: context.business.id,
            system_prompt,
            greeting_template,
            tone,
            language_handling,
            response_length,
            special_instructions,
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
