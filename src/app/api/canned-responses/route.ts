/**
 * 💬 Canned Responses API
 * Manage quick reply templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { CannedResponseSchema } from '@/lib/validation/schemas'

/**
 * GET /api/canned-responses - List canned responses
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { data: responses, error } = await supabaseAdmin
        .from('canned_responses')
        .select('*')
        .eq('business_id', context.business.id)
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (error) throw error

      return NextResponse.json({ responses })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch responses', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/canned-responses - Create canned response
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = CannedResponseSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      const { data: response, error } = await supabaseAdmin
        .from('canned_responses')
        .insert({
          business_id: context.business.id,
          title: validatedData.title,
          content: validatedData.content,
          category: validatedData.category,
          shortcut: validatedData.shortcut,
          created_by: context.employee.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ response, message: 'Quick reply created successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create response', message: error.message },
        { status: 500 }
      )
    }
  })
}
