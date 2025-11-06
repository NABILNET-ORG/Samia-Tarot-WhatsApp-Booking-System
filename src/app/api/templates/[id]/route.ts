/**
 * 📝 AI Templates API - Single Template Operations
 * Update and delete specific templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireBusinessContext } from '@/lib/multi-tenant/middleware'
import { z } from 'zod'

// Validation schema
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  prompt_text: z.string().min(1).max(5000).optional(),
  category: z.string().max(50).optional(),
  variables_json: z.array(z.string()).optional(),
})

/**
 * PATCH /api/templates/[id] - Update template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params
      const body = await request.json()

      // Validate input
      const validation = updateTemplateSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.issues },
          { status: 400 }
        )
      }

      // Check if template exists and belongs to this business
      const { data: existingTemplate, error: fetchError } = await supabaseAdmin
        .from('prompt_templates')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingTemplate) {
        return NextResponse.json(
          { error: 'Template not found or unauthorized' },
          { status: 404 }
        )
      }

      // Update template
      const { data: template, error } = await supabaseAdmin
        .from('prompt_templates')
        .update({
          ...validation.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('business_id', context.business.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        template,
        message: 'Template updated successfully'
      })
    } catch (error: any) {
      console.error('Template update error:', error)
      return NextResponse.json(
        { error: 'Failed to update template', message: error.message },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/templates/[id] - Delete template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireBusinessContext(request, async (context) => {
    try {
      const { id } = params

      // Check if template exists and belongs to this business
      const { data: existingTemplate, error: fetchError } = await supabaseAdmin
        .from('prompt_templates')
        .select('id, business_id')
        .eq('id', id)
        .eq('business_id', context.business.id)
        .single()

      if (fetchError || !existingTemplate) {
        return NextResponse.json(
          { error: 'Template not found or unauthorized' },
          { status: 404 }
        )
      }

      // Delete template
      const { error } = await supabaseAdmin
        .from('prompt_templates')
        .delete()
        .eq('id', id)
        .eq('business_id', context.business.id)

      if (error) throw error

      return NextResponse.json({
        message: 'Template deleted successfully'
      })
    } catch (error: any) {
      console.error('Template deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete template', message: error.message },
        { status: 500 }
      )
    }
  })
}
