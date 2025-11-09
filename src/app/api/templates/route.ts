/**
 * 📝 AI Templates API
 * Manage AI prompt templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { TemplateSchema } from '@/lib/validation/schemas'

/**
 * GET /api/templates - List templates
 */
export async function GET(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { data: templates, error } = await supabaseAdmin
        .from('prompt_templates')
        .select('*')
        .eq('business_id', context.business.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return NextResponse.json({ templates })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to fetch templates', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * POST /api/templates - Create template
 */
export async function POST(request: NextRequest) {
  return requireBusinessContext(request, async (context) => {
    try {
      const body = await request.json()

      // Validate input
      const validation = TemplateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      const validatedData = validation.data

      const { data: template, error } = await supabaseAdmin
        .from('prompt_templates')
        .insert({
          business_id: context.business.id,
          name: validatedData.name,
          description: validatedData.description,
          prompt_text: validatedData.prompt_text,
          category: validatedData.category,
          variables_json: [],
          created_by: context.employee.id,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ template, message: 'Template created successfully' })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create template', message: error.message },
        { status: 500 }
      )
    }
  })
}
